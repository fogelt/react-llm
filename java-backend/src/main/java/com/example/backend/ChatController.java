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
  ToolRegistry registry;

  @Inject
  ObjectMapper objectMapper;

  @POST
  @Path("/chat")
  @Blocking
  @Produces(MediaType.SERVER_SENT_EVENTS)
  @RestStreamElementType(MediaType.APPLICATION_JSON)
  public Multi<String> proxyChat(Map<String, Object> payload) {
    // Vi börjar med stream: false för att kunna hantera verktyg i loop
    payload.put("stream", false);
    boolean hasUsedTool = false;

    System.out.println("--- Analyserar anrop ---");

    while (true) {
      Map<String, Object> responseMap = externalService.getChatCompletion(payload);
      List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");

      if (choices == null || choices.isEmpty()) {
        return Multi.createFrom().item("data: [DONE]\n\n");
      }

      Map<String, Object> aiMessage = (Map<String, Object>) choices.get(0).get("message");
      List<Map<String, Object>> toolCalls = (List<Map<String, Object>>) aiMessage.get("tool_calls");

      // Om AI:n inte vill köra fler verktyg, bryt loopen och streama svaret
      if (toolCalls == null || toolCalls.isEmpty()) {
        break;
      }

      // Om vi är här betyder det att verktyg ska köras
      hasUsedTool = true;
      List<Map<String, Object>> messages = (List<Map<String, Object>>) payload.get("messages");

      // 1. Lägg till AI:ns tool_calls i historiken (viktigt för kontexten)
      messages.add(aiMessage);

      // 2. Exekvera alla efterfrågade verktyg
      for (Map<String, Object> toolCall : toolCalls) {
        String toolResult = executeTool((Map<String, Object>) toolCall.get("function"));

        Map<String, Object> toolResponse = new HashMap<>();
        toolResponse.put("role", "tool");
        toolResponse.put("tool_call_id", toolCall.get("id"));
        toolResponse.put("content", toolResult);

        messages.add(toolResponse);
      }

      // Loopen fortsätter nu och skickar tillbaka resultaten till AI:n
      System.out.println("Verktyg exekverade, skickar tillbaka resultat till AI för nästa steg...");
    }

    // NU är vi klara med alla verktyg - starta streamingen av det slutgiltiga
    // svaret
    payload.put("stream", true);
    Multi<String> aiStream = formatStream(externalService.streamChatCompletion(payload));

    if (hasUsedTool) {
      // Skicka med tool-markören först så frontenden visar den blåa ikonen
      String toolMarker = "data: {\"choices\":[{\"delta\":{\"used_tool\":true}}]}\n\n";
      return Multi.createBy().concatenating().streams(
          Multi.createFrom().item(toolMarker),
          aiStream);
    }

    return aiStream;
  }

  private String executeTool(Map<String, Object> function) {
    String name = (String) function.get("name");
    Object rawArgs = function.get("arguments");
    Map<String, Object> arguments = new HashMap<>();

    try {
      if (rawArgs instanceof String) {
        arguments = objectMapper.readValue((String) rawArgs, Map.class);
      } else if (rawArgs instanceof Map) {
        arguments = (Map<String, Object>) rawArgs;
      }

      System.out.println("Exekverar verktyg: " + name + " med args: " + arguments);

      java.lang.reflect.Method method = registry.getClass().getMethod(name, Map.class);
      return (String) method.invoke(registry, arguments);

    } catch (NoSuchMethodException e) {
      return "Verktyget " + name + " saknas i ToolRegistry.";
    } catch (Exception e) {
      return "Fel vid körning: " + e.getMessage();
    }
  }

  private Multi<String> formatStream(Multi<String> stream) {
    return stream.map(chunk -> {
      String c = chunk.trim();
      if (c.isEmpty())
        return "";
      if (c.startsWith("data:"))
        return chunk + "\n\n";
      return "data: " + chunk + "\n\n";
    });
  }
}