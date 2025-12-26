package com.example.backend;

import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Multi;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestStreamElementType;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.fasterxml.jackson.databind.ObjectMapper;

@Path("/api")
public class ChatController {

  @Inject
  @RestClient
  ChatExternalService externalService;

  @Inject
  ObjectMapper objectMapper;

  @POST
  @Path("/chat")
  @Blocking
  @Produces(MediaType.SERVER_SENT_EVENTS)
  @RestStreamElementType(MediaType.APPLICATION_JSON)
  public Multi<String> proxyChat(Map<String, Object> payload) {
    // 1. Snabbkoll: Behöver AI:n verktyg? (Måste vara stream: false)
    payload.put("stream", false);
    System.out.println("--- Analyserar anrop ---");

    Map<String, Object> responseMap = externalService.getChatCompletion(payload);
    List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");

    if (choices == null || choices.isEmpty()) {
      return Multi.createFrom().item("data: [DONE]\n\n");
    }

    Map<String, Object> aiMessage = (Map<String, Object>) choices.get(0).get("message");
    List<Map<String, Object>> toolCalls = (List<Map<String, Object>>) aiMessage.get("tool_calls");

    // 2. HANTERA VERKTYG
    if (toolCalls != null && !toolCalls.isEmpty()) {
      System.out.println("!!! VERKTYG DETEKTERAT !!!");

      // Vi utgår från första verktygsanropet
      Map<String, Object> toolCall = toolCalls.get(0);
      String toolResult = executeTool((Map<String, Object>) toolCall.get("function"));

      // Uppdatera historiken: Lägg till AI:ns anrop och verktygets svar
      List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");
      messages.add(aiMessage);

      Map<String, Object> toolResponse = new HashMap<>();
      toolResponse.put("role", "tool");
      toolResponse.put("tool_call_id", toolCall.get("id"));
      toolResponse.put("content", toolResult);
      messages.add(toolResponse);

      // Nu när vi har tool-datat, streama det slutgiltiga svaret
      payload.put("stream", true);
      return formatStream(externalService.streamChatCompletion(payload));
    }

    // 3. VANLIGT PRAT (Inga verktyg)
    // Istället för att skicka aiMessage statiskt, gör vi ett nytt anrop med stream:
    // true
    // för att få den sköna "skrivmaskinskänslan" i UI:t
    System.out.println("Inget verktyg behövs, streamar direkt...");
    payload.put("stream", true);
    return formatStream(externalService.streamChatCompletion(payload));
  }

  /**
   * Hjälpmetod för att köra verktyg
   */
  private String executeTool(Map<String, Object> function) {
    String name = (String) function.get("name");
    try {
      if ("get_system_info".equals(name)) {
        return "Operativsystem: " + System.getProperty("os.name") + " " + System.getProperty("os.version");
      }
      return "Verktyget hittades inte.";
    } catch (Exception e) {
      return "Fel: " + e.getMessage();
    }
  }

  /**
   * Hjälpmetod för att rensa SSE-strömmen så frontenden förstår den
   */
  private Multi<String> formatStream(Multi<String> stream) {
    return stream.map(chunk -> {
      String c = chunk.trim();
      if (c.isEmpty())
        return "";
      // Om Llama-servern redan skickar "data:", skicka vidare som den är
      if (c.startsWith("data:"))
        return chunk + "\n\n";
      // Annars lägg till det (Quarkus kan ibland strippa det beroende på config)
      return "data: " + chunk + "\n\n";
    });
  }
}