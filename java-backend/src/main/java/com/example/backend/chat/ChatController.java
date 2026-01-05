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
          // 1. Initialize logic
          Set<String> seenUrls = new HashSet<>();
          sendEvent(emitter, "thinking", "Analyzing request...");

          @SuppressWarnings("unchecked")
          List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
          if (messages == null) {
            messages = new ArrayList<>();
            payload.put("messages", messages);
          }

          // Synchronous research phase
          payload.put("stream", false);
          int loopCount = 0;
          final int MAX_ITERATIONS = 5;

          // 2. Reasoning Loop
          while (loopCount < MAX_ITERATIONS) {
            ChatResponse response = externalService.getChatCompletion(payload);
            if (response == null || response.choices == null || response.choices.isEmpty())
              break;

            ChatResponse.Message aiMessage = response.choices.get(0).message;
            if (aiMessage.tool_calls == null || aiMessage.tool_calls.isEmpty())
              break;

            // Add AI's intent to message history
            Map<String, Object> assistantHistoryEntry = new HashMap<>();
            assistantHistoryEntry.put("role", "assistant");
            assistantHistoryEntry.put("tool_calls", aiMessage.tool_calls);
            messages.add(assistantHistoryEntry);

            // Execute the FIRST tool call (Sequential reasoning)
            ChatResponse.ToolCall toolCall = aiMessage.tool_calls.get(0);
            String toolName = toolCall.function.name;

            // Notify UI that a tool has started
            sendEvent(emitter, "tool_start", "web");

            String result = toolExecutor.execute(toolCall.function, seenUrls);
            String safeResult = (result == null || result.isBlank()) ? "No results found." : result;

            // Update URL memory for deduplication
            try {
              List<Map<String, Object>> resultData = objectMapper.readValue(safeResult, new TypeReference<>() {
              });
              if (!resultData.isEmpty()) {
                String url = (String) resultData.get(0).get("url");
                if (url != null)
                  seenUrls.add(url);
              }
            } catch (Exception ignored) {
            }

            // Send the tool results to the UI to update icons
            if ("web_search".equals(toolName)) {
              sendEvent(emitter, "tool_output", safeResult);
            }

            // Add tool output back to history for the AI to read next turn
            Map<String, Object> toolResponse = new HashMap<>();
            toolResponse.put("role", "tool");
            toolResponse.put("tool_call_id", toolCall.id);
            toolResponse.put("content", safeResult);
            messages.add(toolResponse);

            sendEvent(emitter, "thinking", "Analyzing results...");
            loopCount++;
          }

          // 4. Transition to Final Answer
          if (loopCount >= MAX_ITERATIONS) {
            sendEvent(emitter, "thinking", "Finalizing response...");
          }

          // Turn streaming back ON for the final user-facing text
          payload.put("stream", true);

          // Subscribe to the stream and pipe chunks directly to our emitter
          externalService.streamChatCompletion(payload).subscribe().with(
              item -> {
                // Check if the emitter is still active before emitting
                if (!emitter.isCancelled()) {
                  emitter.emit(formatChunk(item));
                }
              },
              err -> {
                sendEvent(emitter, "error", "Final Stream Error: " + err.getMessage());
                emitter.complete();
              },
              emitter::complete // Successfully finish the SSE stream
          );

        } catch (Exception e) {
          e.printStackTrace();
          sendEvent(emitter, "error", "System Error: " + e.getMessage());
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
    if (chunk == null || chunk.trim().isEmpty())
      return "";
    if (chunk.startsWith("data:") || chunk.equals("[DONE]"))
      return chunk + "\n\n";
    return "data: " + chunk + "\n\n";
  }
}