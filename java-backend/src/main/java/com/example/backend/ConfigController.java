package com.example.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ConfigController {

  private final LlamaRunner llamaRunner;

  public ConfigController(LlamaRunner llamaRunner) {
    this.llamaRunner = llamaRunner;
  }

  @PostMapping("/start")
  public ResponseEntity<String> startServer(@RequestBody Map<String, String> paths) {
    try {
      String modelPath = paths.get("modelPath");
      String mmprojPath = paths.get("mmprojPath");
      String contextSize = paths.get("contextSize");

      if (llamaRunner.isRunning()) {
        // Stop the old one before starting a new one
        llamaRunner.stopLlama();
      }

      llamaRunner.startLlama(modelPath, mmprojPath, contextSize);
      return ResponseEntity.ok("Llama server started successfully on port " + llamaRunner.SERVER_PORT);

    } catch (IllegalStateException e) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("Error starting process: Check if " + llamaRunner.LLAMA_SERVER_EXE + " is in your system PATH.");
    }
  }

  @PostMapping("/stop")
  public ResponseEntity<String> stopServer() {
    llamaRunner.stopLlama();
    return ResponseEntity.ok("Llama server stopped.");
  }

  @GetMapping("/status")
  public Map<String, Object> getStatus() {
    return Map.of(
        "running", llamaRunner.isRunning(),
        "modelPath", llamaRunner.getCurrentModelPath());
  }
}