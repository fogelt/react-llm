package com.example.backend;

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
import com.fasterxml.jackson.databind.ObjectMapper;

@Path("/api")
public class ChatController {

  @Inject
  @RestClient
  ChatExternalService externalService;

  @Inject
  ToolRegistry registry;

  @Inject
  ObjectMapper objectMapper;

  @POST
  @Path("/chat")
  @Blocking
  @Produces(MediaType.SERVER_SENT_EVENTS)
  @RestStreamElementType(MediaType.APPLICATION_JSON)
  public Multi<String> proxyChat(Map<String, Object> payload) {
    return Multi.createFrom().emitter(emitter -> {
      // CRITICAL FIX: Explicitly move the execution to a worker thread
      Infrastructure.getDefaultWorkerPool().execute(() -> {
        try {
          // 1. Initial status update
          sendEvent(emitter, "thinking", "Analyzing request...");

          // 2. Ensure messages list exists
          List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
          if (messages == null) {
            messages = new ArrayList<>();
            payload.put("messages", messages);
          }

          payload.put("stream", false);
          List<String> usedTools = new ArrayList<>();

          // --- TOOL LOOP (Safe to block here) ---
          while (true) {
            Map<String, Object> responseMap = externalService.getChatCompletion(payload);
            if (responseMap == null || !responseMap.containsKey("choices"))
              break;

            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
            if (choices == null || choices.isEmpty())
              break;

            Map<String, Object> aiMessage = (Map<String, Object>) choices.get(0).get("message");
            List<Map<String, Object>> toolCalls = (List<Map<String, Object>>) aiMessage.get("tool_calls");

            if (toolCalls == null || toolCalls.isEmpty())
              break;

            // Add assistant's call to history
            messages.add(aiMessage);

            for (Map<String, Object> toolCall : toolCalls) {
              Map<String, Object> function = (Map<String, Object>) toolCall.get("function");
              String toolName = (String) function.get("name");
              usedTools.add(toolName);

              // Notify frontend a tool started
              sendEvent(emitter, "tool_start", toolName);

              String result = executeTool(function);

              Map<String, Object> toolResponse = new HashMap<>();
              toolResponse.put("role", "tool");
              toolResponse.put("tool_call_id", toolCall.get("id"));
              toolResponse.put("content", result != null ? result : "No result");
              messages.add(toolResponse);
            }
            // Feedback between multi-step tool calls
            sendEvent(emitter, "thinking", "Processing tool results...");
          }

          // 3. Update with summary if tools were used
          if (!usedTools.isEmpty()) {
            sendEvent(emitter, "completed", String.join(", ", usedTools));
          }

          // 4. Final Stream
          payload.put("stream", true);
          externalService.streamChatCompletion(payload).subscribe().with(
              item -> emitter.emit(formatChunk(item)),
              err -> {
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
    String json = String.format(
        "data: {\"choices\":[{\"delta\":{\"used_tool\":true, \"status\":\"%s\", \"tool_name\":\"%s\"}}]}\n\n",
        status, name);
    emitter.emit(json);
  }

  private String formatChunk(String chunk) {
    if (chunk == null)
      return "";
    String c = chunk.trim();
    if (c.isEmpty())
      return "";
    return c.startsWith("data:") ? chunk + "\n\n" : "data: " + chunk + "\n\n";
  }

  private String executeTool(Map<String, Object> function) {
    try {
      String name = (String) function.get("name");
      Object rawArgs = function.get("arguments");
      Map<String, Object> arguments = (rawArgs instanceof String)
          ? objectMapper.readValue((String) rawArgs, Map.class)
          : (Map<String, Object>) rawArgs;

      java.lang.reflect.Method method = registry.getClass().getMethod(name, Map.class);
      return (String) method.invoke(registry, arguments);
    } catch (Exception e) {
      return "Error: " + e.getMessage();
    }
  }
}