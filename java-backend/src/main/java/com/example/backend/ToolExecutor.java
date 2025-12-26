package com.example.backend;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class ToolExecutor {

  @Inject
  ToolRegistry registry;

  @Inject
  ObjectMapper objectMapper;

  private static final Pattern QWEN_PATTERN = Pattern.compile(
      "<\\|tool_call\\|>(?<json>\\{.*?\\})",
      Pattern.DOTALL);

  public String processToolCalls(String aiResponse) {
    Matcher matcher = QWEN_PATTERN.matcher(aiResponse);

    if (matcher.find()) {
      String jsonStr = matcher.group("json").trim();

      try {
        // Qwen uses "name" and "arguments" (OpenAI style)
        Map<String, Object> toolCall = objectMapper.readValue(jsonStr, Map.class);
        String functionName = (String) toolCall.get("name");
        Map<String, Object> args = (Map<String, Object>) toolCall.get("arguments");

        if ("get_system_info".equals(functionName)) {
          String result = registry.get_system_info(args);
          // Qwen expects the result wrapped in tool_response tags
          return "<|tool_response|>\n" + result + "\n<|tool_response|>";
        }

      } catch (Exception e) {
        return "<|tool_response|>\nError: " + e.getMessage() + "\n<|tool_response|>";
      }
    }
    return null;
  }
}