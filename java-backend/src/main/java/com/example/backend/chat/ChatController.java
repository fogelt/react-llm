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
          // Memory to track URLs visited in THIS specific reasoning loop
          Set<String> seenUrls = new HashSet<>();

          sendEvent(emitter, "thinking", "Analyzing request...");

          @SuppressWarnings("unchecked")
          List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
          if (messages == null) {
            messages = new ArrayList<>();
            payload.put("messages", messages);
          }

          // Disable streaming during the reasoning loops to handle tool calls
          // synchronously
          payload.put("stream", false);

          int loopCount = 0;
          final int MAX_ITERATIONS = 5;

          while (loopCount < MAX_ITERATIONS) {
            ChatResponse response = externalService.getChatCompletion(payload);

            if (response == null || response.choices == null || response.choices.isEmpty()) {
              break;
            }

            ChatResponse.Message aiMessage = response.choices.get(0).message;

            // If no tool calls, the AI is ready to give the final answer
            if (aiMessage.tool_calls == null || aiMessage.tool_calls.isEmpty()) {
              break;
            }

            // Add the assistant's intent to call tools to history
            Map<String, Object> assistantHistoryEntry = new HashMap<>();
            assistantHistoryEntry.put("role", "assistant");
            assistantHistoryEntry.put("tool_calls", aiMessage.tool_calls);
            messages.add(assistantHistoryEntry);

            // --- SEQUENTIAL REASONING START ---
            // We execute only the FIRST tool call to force step-by-step thinking
            ChatResponse.ToolCall toolCall = aiMessage.tool_calls.get(0);
            String toolName = toolCall.function.name;
            String uiTarget = "web";

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

            // Pass the seenUrls to the executor to filter results
            String result = toolExecutor.execute(toolCall.function, seenUrls);
            String safeResult = (result == null || result.isBlank()) ? "No results found." : result;

            // Extract the URL from the result to add it to our "seen" memory
            try {
              List<Map<String, Object>> resultData = objectMapper.readValue(safeResult, new TypeReference<>() {
              });
              if (!resultData.isEmpty()) {
                String url = (String) resultData.get(0).get("url");
                if (url != null) {
                  seenUrls.add(url);
                }
              }
            } catch (Exception e) {
              // If it's not a list (error message), we just move on
            }

            if ("web_search".equals(toolName)) {
              sendEvent(emitter, "tool_output", safeResult);
            }

            // Add the tool's result back to history so the AI can read it in the next loop
            Map<String, Object> toolResponse = new HashMap<>();
            toolResponse.put("role", "tool");
            toolResponse.put("tool_call_id", toolCall.id);
            toolResponse.put("content", safeResult);
            messages.add(toolResponse);
            // --- SEQUENTIAL REASONING END ---

            sendEvent(emitter, "thinking", "Analyzing results...");
            loopCount++;
          }

          if (loopCount >= MAX_ITERATIONS) {
            sendEvent(emitter, "error", "Deep research limit reached. Formulating final answer.");
          }

          // Finally, stream the actual text response back to the user
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

  private void sendEvent(MultiEmitter<? super String> emitter, String status, String content) {
    try {
      Map<String, Object> delta = new HashMap<>();
      delta.put("used_tool", true);
      delta.put("status", status);

      if ("tool_output".equals(status)) {
        delta.put("content", content);
      } else {
        delta.put("tool_name", content);
      }

      Map<String, Object> choice = new HashMap<>();
      choice.put("delta", delta);

      Map<String, Object> envelope = new HashMap<>();
      envelope.put("choices", Collections.singletonList(choice));

      String json = objectMapper.writeValueAsString(envelope);
      emitter.emit("data: " + json + "\n\n");
    } catch (Exception e) {
      emitter.emit("data: {\"error\": \"Failed to serialize event\"}\n\n");
    }
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