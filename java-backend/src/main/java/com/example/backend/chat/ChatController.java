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
          // Track URLs to ensure the AI finds NEW info each loop
          Set<String> seenUrls = new HashSet<>();

          sendEvent(emitter, "thinking", "Analyzing request...");

          @SuppressWarnings("unchecked")
          List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
          if (messages == null) {
            messages = new ArrayList<>();
            payload.put("messages", messages);
          }

          // Perform research steps synchronously
          payload.put("stream", false);

          int loopCount = 0;
          final int MAX_ITERATIONS = 5;

          while (loopCount < MAX_ITERATIONS) {
            ChatResponse response = externalService.getChatCompletion(payload);

            if (response == null || response.choices == null || response.choices.isEmpty()) {
              break;
            }

            ChatResponse.Message aiMessage = response.choices.get(0).message;

            // No more tools? AI is ready to answer.
            if (aiMessage.tool_calls == null || aiMessage.tool_calls.isEmpty()) {
              break;
            }

            // Log assistant's intent
            Map<String, Object> assistantHistoryEntry = new HashMap<>();
            assistantHistoryEntry.put("role", "assistant");
            assistantHistoryEntry.put("tool_calls", aiMessage.tool_calls);
            messages.add(assistantHistoryEntry);

            // Execute ONLY the first tool call to force sequential reasoning
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

            // Execute and filter results
            String result = toolExecutor.execute(toolCall.function, seenUrls);
            String safeResult = (result == null || result.isBlank()) ? "No results found." : result;

            // Update seenUrls from the new search result
            try {
              List<Map<String, Object>> resultData = objectMapper.readValue(safeResult, new TypeReference<>() {
              });
              if (!resultData.isEmpty()) {
                String url = (String) resultData.get(0).get("url");
                if (url != null) {
                  seenUrls.add(url);
                }
              }
            } catch (Exception ignored) {
            }

            if ("web_search".equals(toolName)) {
              sendEvent(emitter, "tool_output", safeResult);
            }

            // Feed result back to AI history
            Map<String, Object> toolResponse = new HashMap<>();
            toolResponse.put("role", "tool");
            toolResponse.put("tool_call_id", toolCall.id);
            toolResponse.put("content", safeResult);
            messages.add(toolResponse);

            sendEvent(emitter, "thinking", "Analyzing results...");
            loopCount++;
          }

          if (loopCount >= MAX_ITERATIONS) {
            sendEvent(emitter, "thinking", "Research concluded. Preparing final answer...");
          }

          // Switch back to streaming for the final user-facing response
          payload.put("stream", true);

          externalService.streamChatCompletion(payload).subscribe().with(
              item -> {
                if (!emitter.isCancelled()) {
                  emitter.emit(formatChunk(item));
                }
              },
              err -> {
                System.err.println("Final stream error: " + err.getMessage());
                sendEvent(emitter, "error", "Connection lost during final answer.");
                emitter.complete();
              },
              emitter::complete // This safely closes the SSE channel
          );

        } catch (Exception e) {
          e.printStackTrace();
          sendEvent(emitter, "error", "System Error: " + e.getClass().getSimpleName());
          if (!emitter.isCancelled())
            emitter.complete();
        }
      });
    });
  }

  private void sendEvent(MultiEmitter<? super String> emitter, String status, String content) {
    if (emitter.isCancelled())
      return;
    try {
      Map<String, Object> delta = new HashMap<>();
      delta.put("used_tool", true);
      delta.put("status", status);

      if ("tool_output".equals(status)) {
        delta.put("content", content);
      } else {
        delta.put("tool_name", content);
      }

      Map<String, Object> envelope = Collections.singletonMap("choices",
          Collections.singletonList(Collections.singletonMap("delta", delta)));

      emitter.emit("data: " + objectMapper.writeValueAsString(envelope) + "\n\n");
    } catch (Exception ignored) {
    }
  }

  private String formatChunk(String chunk) {
    if (chunk == null)
      return "";
    String c = chunk.trim();
    if (c.isEmpty())
      return "";
    if (c.startsWith("data:") || c.equals("[DONE]"))
      return c + "\n\n";
    return "data: " + chunk + "\n\n";
  }
}