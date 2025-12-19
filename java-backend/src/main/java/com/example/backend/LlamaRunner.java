package com.example.backend;

import jakarta.annotation.PreDestroy;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class LlamaRunner {

  private Process llamaProcess;
  private String currentModelPath = "";
  public final String SERVER_PORT = "8082";
  private final AtomicLong lastHeartbeat = new AtomicLong(System.currentTimeMillis());
  private final long TIMEOUT_MS = 15000;

  public void resetHeartbeat() {
    long now = System.currentTimeMillis();
    lastHeartbeat.set(now);
  }

  // Helper to detect the OS and return the correct binary name.
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

  @Scheduled(fixedDelay = 5000)
  public void checkWatchdog() {
    if (isRunning()) {
      long now = System.currentTimeMillis();
      long elapsed = now - lastHeartbeat.get();

      if (elapsed > TIMEOUT_MS) {
        System.out.println("🚨 WATCHDOG TRIGGERED: No heartbeat detected for " + (elapsed / 1000) + "s.");
        stopLlama();
      }
    }
  }

  public void startLlama(String modelPath, String mmprojPath, String contextSize)
      throws IOException, IllegalStateException {

    if (isRunning()) {
      throw new IllegalStateException("Llama Server is already running.");
    }

    Path normalizedModel = Paths.get(modelPath).toAbsolutePath();
    this.currentModelPath = normalizedModel.toString();
    String binary = getBinaryName();

    List<String> command = new ArrayList<>();
    command.add(binary);
    command.add("-m");
    command.add(currentModelPath);
    command.add("--ctx-size");
    command.add(contextSize);
    command.add("--port");
    command.add(SERVER_PORT);

    // Only add vision projector if a path was actually provided
    if (mmprojPath != null && !mmprojPath.isBlank()) {
      Path normalizedMmproj = Paths.get(mmprojPath).toAbsolutePath();
      command.add("--mmproj");
      command.add(normalizedMmproj.toString());
      System.out.println("Vision enabled with: " + normalizedMmproj);
    } else {
      System.out.println("Text-only mode (No vision projector)");
    }

    ProcessBuilder builder = new ProcessBuilder(command);
    builder.directory(Paths.get("").toAbsolutePath().toFile());
    builder.redirectErrorStream(true);

    try {
      this.llamaProcess = builder.start();
      resetHeartbeat();
      waitForLlamaReadiness(this.llamaProcess);
    } catch (IOException e) {
      throw new IOException("Failed to launch " + binary + ": " + e.getMessage());
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