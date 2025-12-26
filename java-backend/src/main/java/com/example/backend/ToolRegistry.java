package com.example.backend;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;

@ApplicationScoped
public class ToolRegistry {

  // Example Tool: Get system information
  public String get_system_info(Map<String, Object> args) {
    return "Operating System: " + System.getProperty("os.name") +
        ", Java Version: " + System.getProperty("java.version");
  }

  // Example Tool: List files in a specific directory
  public String list_local_files(Map<String, Object> args) {
    String folder = (String) args.getOrDefault("folder", "downloads");
    return "Files in " + folder + ": model1.gguf, model2.gguf";
  }
}