package com.example.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ConfigController {

  private final LlamaRunner llamaRunner;
  private final ModelDownloader modelDownloader;

  public ConfigController(LlamaRunner llamaRunner, ModelDownloader modelDownloader) {
    this.llamaRunner = llamaRunner;
    this.modelDownloader = modelDownloader;
  }

  @PostMapping("/download")
  public ResponseEntity<Map<String, String>> downloadModel(@RequestBody Map<String, String> request) {
    try {
      String repo = request.get("repo"); // e.g., "bartowski/Llama-3.1-8B-Instruct-GGUF"
      String fileName = request.get("fileName"); // e.g., "Llama-3.1-8B-Instruct-Q4_K_M.gguf"
      String targetDir = "downloads"; // Or use System.getProperty("user.home") + "/models"

      // In a real app, you might want to run this in a separate Thread (@Async)
      modelDownloader.downloadGguf(repo, fileName, targetDir);

      return ResponseEntity.ok(Map.of("message", "Model downloaded to " + targetDir));
    } catch (Exception e) {
      return ResponseEntity.status(500).body(Map.of("message", "Download failed: " + e.getMessage()));
    }
  }

  @GetMapping("/download-status")
  public Map<String, Integer> getDownloadStatus(@RequestParam String fileName) {
    return Map.of("progress", modelDownloader.getProgress(fileName));
  }

  @GetMapping("/files")
  public ResponseEntity<Map<String, List<String>>> listAvailableFiles() {
    Path downloadPath = Paths.get("downloads");
    try {
      if (!Files.exists(downloadPath))
        Files.createDirectories(downloadPath);

      // try-with-resources ensures the directory stream is closed properly
      try (var stream = Files.list(downloadPath)) {
        List<String> files = stream
            .map(path -> path.getFileName().toString())
            .filter(name -> name.endsWith(".gguf"))
            .toList();
        return ResponseEntity.ok(Map.of("files", files));
      }
    } catch (IOException e) {
      return ResponseEntity.status(500).body(Map.of("files", List.of()));
    }
  }

  @PostMapping("/start")
  public ResponseEntity<Map<String, String>> startServer(@RequestBody Map<String, String> config) {
    try {
      String modelPath = config.get("modelPath");
      String mmprojPath = config.get("mmprojPath");
      String contextSize = config.getOrDefault("contextSize", "1024");

      // Validation logic
      if (modelPath == null || modelPath.isBlank()) {
        return ResponseEntity.badRequest().body(Map.of("message", "Model path is required."));
      }

      if (llamaRunner.isRunning()) {
        llamaRunner.stopLlama();
      }

      llamaRunner.startLlama(modelPath, mmprojPath, contextSize);

      return ResponseEntity.ok(Map.of(
          "message", "Server started successfully",
          "port", llamaRunner.SERVER_PORT));

    } catch (IllegalStateException e) {
      // Conflict (409) - e.g., already running
      return ResponseEntity.status(HttpStatus.CONFLICT)
          .body(Map.of("message", e.getMessage()));
    } catch (IOException e) {
      // provides the specific binary error from LlamaRunner
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("message", "Backend Error: " + e.getMessage()));
    }
  }

  @PostMapping("/stop")
  public ResponseEntity<Map<String, String>> stopServer() {
    llamaRunner.stopLlama();
    return ResponseEntity.ok(Map.of("message", "Llama server stopped."));
  }

  @GetMapping("/status")
  public Map<String, Object> getStatus() {
    return Map.of(
        "running", llamaRunner.isRunning(),
        "modelPath", llamaRunner.getCurrentModelPath(),
        "os", System.getProperty("os.name") // Useful for frontend debugging
    );
  }

  @PostMapping("/heartbeat")
  public ResponseEntity<Void> heartbeat() {
    llamaRunner.resetHeartbeat();
    return ResponseEntity.ok().build();
  }
}