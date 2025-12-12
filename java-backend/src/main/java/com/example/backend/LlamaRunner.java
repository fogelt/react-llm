package com.example.backend;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class LlamaRunner {

  private Process llamaProcess;
  private String currentModelPath = "";
  private String currentMmprojPath = "";
  public final String LLAMA_SERVER_EXE = "llama-server.exe";
  public final String SERVER_PORT = "8082";

  public boolean isRunning() {
    return llamaProcess != null && llamaProcess.isAlive();
  }

  public String getCurrentModelPath() {
    return currentModelPath;
  }

  // Method to stop the server
  @PreDestroy
  public void stopLlama() {
    if (llamaProcess != null && llamaProcess.isAlive()) {
      System.out.println("🛑 Stopping Llama Server...");
      llamaProcess.destroyForcibly();
      this.llamaProcess = null;
      System.out.println("Llama Server stopped.");
    }
  }

  // Method to start the server with dynamic paths
  public void startLlama(String modelPath, String mmprojPath) throws IOException, IllegalStateException {
    if (isRunning()) {
      throw new IllegalStateException("Llama Server is already running. Please stop it first.");
    }

    if (modelPath == null || modelPath.isEmpty() || mmprojPath == null || mmprojPath.isEmpty()) {
      throw new IllegalArgumentException("Model paths cannot be null or empty.");
    }

    System.out.println("🚀 Starting Llama Server with Model: " + modelPath);

    this.currentModelPath = modelPath;
    this.currentMmprojPath = mmprojPath;

    ProcessBuilder builder = new ProcessBuilder(
        LLAMA_SERVER_EXE,
        "-m", modelPath,
        "--ctx-size", "1024",
        "--mmproj", mmprojPath,
        "--port", SERVER_PORT);

    builder.redirectErrorStream(true);

    this.llamaProcess = builder.start();

    System.out.println("⏳ Waiting for Llama server readiness...");
    waitForLlamaReadiness(this.llamaProcess);

    // If the method reaches this point, the server is ready
  }

  private void waitForLlamaReadiness(Process process) throws IOException {
    // Read the output stream using a standard reader
    try (var reader = new java.io.BufferedReader(
        new java.io.InputStreamReader(process.getInputStream()))) {

      String line;
      final String READY_MESSAGE = "server is listening on";
      final String ERROR_MESSAGE = "error: failed to load model"; // Common Llama error line

      while ((line = reader.readLine()) != null) {
        System.out.println("[Llama]: " + line);

        if (line.contains(READY_MESSAGE)) {
          System.out.println("✅ Llama Server is fully ready on port " + SERVER_PORT);
          return; // Success Return.
        }

        if (line.contains(ERROR_MESSAGE)) {
          // Throw an error that the ConfigController can catch and return to the user
          throw new IOException("Llama server failed to start: Invalid model path or format.");
        }

        if (!process.isAlive()) {
          // If the process exited before sending the ready signal, it failed.
          throw new IOException("Llama server failed to start without reporting readiness. Check logs.");
        }
      }

      throw new IOException("Llama server stream closed prematurely.");
    }
  }
}