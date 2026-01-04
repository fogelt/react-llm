package com.example.backend.chat;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatResponse {
  public List<Choice> choices;

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Choice {
    public Message message;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Message {
    public String role;
    public String content;
    public List<ToolCall> tool_calls;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ToolCall {
    public String id;
    public String type;
    public Function function;
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Function {
    public String name;
    public Object arguments;
  }
}