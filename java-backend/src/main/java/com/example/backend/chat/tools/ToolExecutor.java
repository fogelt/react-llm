package com.example.backend.chat.tools;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.backend.chat.ChatResponse;
import java.util.Map;
import java.lang.reflect.Method;

@ApplicationScoped
public class ToolExecutor {

  @Inject
  ToolRegistry registry;

  @Inject
  ObjectMapper objectMapper;

  public String execute(ChatResponse.Function function) {
    String name = function.name;
    try {
      Object rawArgs = function.arguments;
      Map<String, Object> arguments;

      if (rawArgs instanceof String stringArgs) {
        arguments = objectMapper.readValue(stringArgs, new TypeReference<Map<String, Object>>() {
        });
      } else if (rawArgs instanceof Map) {
        @SuppressWarnings("unchecked")
        Map<String, Object> castedMap = (Map<String, Object>) rawArgs;
        arguments = castedMap;
      } else {
        return "Error: Unsupported arguments format for tool: " + name;
      }

      Method method = registry.getClass().getMethod(name, Map.class);
      return (String) method.invoke(registry, arguments);

    } catch (NoSuchMethodException | SecurityException e) {
      return "Error: Tool '" + name + "' is not implemented in ToolRegistry.";
    } catch (Exception e) {
      e.printStackTrace();
      return "Error executing tool '" + name + "': " + e.getMessage();
    }
  }
}