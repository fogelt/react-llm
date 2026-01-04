package com.example.backend.chat;

import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.subscription.MultiEmitter;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestStreamElementType;
import java.util.*;

import com.example.backend.chat.tools.ToolExecutor;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Path("/api")
public class ChatController {

  @Inject
  @RestClient
  ChatExternalService externalService;

  @Inject
  ToolExecutor toolExecutor;

  @Inject
  ObjectMapper objectMapper;

  @POST
  @Path("/chat")
  @Blocking
  @Produces(MediaType.SERVER_SENT_EVENTS)
  @RestStreamElementType(MediaType.APPLICATION_JSON)
  public Multi<String> proxyChat(Map<String, Object> payload) {
    return Multi.createFrom().emitter(emitter -> {
      Infrastructure.getDefaultWorkerPool().execute(() -> {
        try {
          sendEvent(emitter, "thinking", "Analyzing request...");

          @SuppressWarnings("unchecked")
          List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
          if (messages == null) {
            messages = new ArrayList<>();
            payload.put("messages", messages);
          }

          payload.put("stream", false);

          List<String> usedTools = new ArrayList<>();
          int loopCount = 0;
          final int MAX_ITERATIONS = 5;

          while (loopCount < MAX_ITERATIONS) {
            ChatResponse response = externalService.getChatCompletion(payload);

            if (response == null || response.choices == null || response.choices.isEmpty()) {
              break;
            }

            ChatResponse.Message aiMessage = response.choices.get(0).message;

            if (aiMessage.tool_calls == null || aiMessage.tool_calls.isEmpty()) {
              break;
            }

            Map<String, Object> assistantHistoryEntry = new HashMap<>();
            assistantHistoryEntry.put("role", "assistant");
            assistantHistoryEntry.put("tool_calls", aiMessage.tool_calls);
            messages.add(assistantHistoryEntry);

            // Execute each tool call
            for (ChatResponse.ToolCall toolCall : aiMessage.tool_calls) {
              String toolName = toolCall.function.name;
              String uiTarget = "web"; // Default label

              try {
                Map<String, Object> argsMap = objectMapper.readValue(
                    toolCall.function.arguments,
                    new TypeReference<Map<String, Object>>() {
                    });
                uiTarget = (String) argsMap.getOrDefault("target", "web");
              } catch (Exception e) {
                uiTarget = toolName;
              }

              sendEvent(emitter, "tool_start", uiTarget);

              String result = toolExecutor.execute(toolCall.function);
              String safeResult = (result == null || result.isBlank()) ? "No results found." : result;

              Map<String, Object> toolResponse = new HashMap<>();
              toolResponse.put("role", "tool");
              toolResponse.put("tool_call_id", toolCall.id);
              toolResponse.put("content", safeResult);
              messages.add(toolResponse);
            }

            sendEvent(emitter, "thinking", "Analyzing results...");
            loopCount++;
          }

          if (loopCount >= MAX_ITERATIONS) {
            sendEvent(emitter, "error", "Iteration limit reached.");
          }

          if (!usedTools.isEmpty()) {
            sendEvent(emitter, "completed", String.join(", ", usedTools));
          }

          payload.put("stream", true);
          externalService.streamChatCompletion(payload).subscribe().with(
              item -> emitter.emit(formatChunk(item)),
              err -> {
                System.err.println("Streaming error: " + err.getMessage());
                sendEvent(emitter, "error", "Stream Failure: " + err.getMessage());
                emitter.complete();
              },
              emitter::complete);

        } catch (Exception e) {
          e.printStackTrace();
          sendEvent(emitter, "error", "System Error: " + e.getClass().getSimpleName());
          emitter.complete();
        }
      });
    });
  }

  private void sendEvent(MultiEmitter<? super String> emitter, String status, String name) {
    String safeName = (name != null) ? name.replace("\"", "\\\"") : "";
    String json = String.format(
        "data: {\"choices\":[{\"delta\":{\"used_tool\":true, \"status\":\"%s\", \"tool_name\":\"%s\"}}]}\n\n",
        status, safeName);
    emitter.emit(json);
  }

  private String formatChunk(String chunk) {
    if (chunk == null)
      return "";
    String c = chunk.trim();
    if (c.isEmpty())
      return "";
    if (c.startsWith("data:"))
      return c + "\n\n";
    if (c.equals("[DONE]"))
      return "data: [DONE]\n\n";
    return "data: " + chunk + "\n\n";
  }
}