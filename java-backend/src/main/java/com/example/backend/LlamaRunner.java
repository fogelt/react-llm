package com.example.backend;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class LlamaRunner {

  private Process llamaProcess;
  private String currentModelPath = "";
  public final String SERVER_PORT = "8082";

  /**
   * Helper to detect the OS and return the correct binary name.
   */
  private String getBinaryName() {
    String os = System.getProperty("os.name").toLowerCase();
    if (os.contains("win")) {
      return "llama-server.exe";
    }
    // Linux and Mac use the same binary name usually
    return "./llama-server";
  }

  public String getCurrentModelPath() {
    return currentModelPath;
  }

  public boolean isRunning() {
    return llamaProcess != null && llamaProcess.isAlive();
  }

  @PreDestroy
  public void stopLlama() {
    if (isRunning()) {
      System.out.println("🛑 Stopping Llama Server...");
      llamaProcess.destroyForcibly();
      this.llamaProcess = null;
    }
  }

  public void startLlama(String modelPath, String mmprojPath, String contextSize)
      throws IOException, IllegalStateException {

    if (isRunning()) {
      throw new IllegalStateException("Llama Server is already running.");
    }

    // Normalize paths using NIO to handle different OS slashes correctly
    Path normalizedModel = Paths.get(modelPath).toAbsolutePath();
    Path normalizedMmproj = Paths.get(mmprojPath).toAbsolutePath();

    String binary = getBinaryName();
    System.out.println("🚀 Starting " + binary + " with Model: " + normalizedModel);

    this.currentModelPath = normalizedModel.toString();

    // ProcessBuilder needs a list of strings
    ProcessBuilder builder = new ProcessBuilder(
        binary,
        "-m", currentModelPath,
        "--ctx-size", contextSize,
        "--mmproj", normalizedMmproj.toString(),
        "--port", SERVER_PORT);

    // Crucial: Set the working directory to the folder containing the binary
    // This ensures it can find its own DLLs/libraries on Windows
    builder.directory(Paths.get("").toAbsolutePath().toFile());

    builder.redirectErrorStream(true);

    try {
      this.llamaProcess = builder.start();
      waitForLlamaReadiness(this.llamaProcess);
    } catch (IOException e) {
      // This is where your React 'showError' will get the message
      throw new IOException("Failed to launch " + binary + ". Is it in the root folder? " + e.getMessage());
    }
  }

  private void waitForLlamaReadiness(Process process) throws IOException {
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
      String line;
      final String READY_MESSAGE = "server is listening on";
      final String ERROR_MESSAGE = "error: failed to load model";

      while ((line = reader.readLine()) != null) {
        System.out.println("[Llama]: " + line);

        if (line.contains(READY_MESSAGE)) {
          System.out.println("✅ Llama Server ready on port " + SERVER_PORT);
          return;
        }

        if (line.contains(ERROR_MESSAGE)) {
          stopLlama();
          throw new IOException("Model failed to load. Check file format/path.");
        }

        if (!process.isAlive()) {
          throw new IOException("Process terminated unexpectedly with exit code: " + process.exitValue());
        }
      }
    }
  }
}