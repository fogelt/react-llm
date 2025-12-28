package com.example.backend;

import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@ApplicationScoped
public class LlamaRunner {

  private Process llamaProcess;
  private String currentModelPath = "";
  public final String SERVER_PORT = "8082";
  private final AtomicLong lastHeartbeat = new AtomicLong(System.currentTimeMillis());
  private final long TIMEOUT_MS = 15000;

  public void resetHeartbeat() {
    lastHeartbeat.set(System.currentTimeMillis());
  }

  private String getBinaryName() {
    String os = System.getProperty("os.name").toLowerCase();
    if (os.contains("win")) {
      return "llama-server.exe";
    }
    return "llama-server";
  }

  public String getCurrentModelPath() {
    return currentModelPath;
  }

  public boolean isRunning() {
    return llamaProcess != null && llamaProcess.isAlive();
  }

  public void stopLlama(@Observes ShutdownEvent ev) {
    if (isRunning()) {
      System.out.println("🛑 Stopping Llama Server...");
      llamaProcess.destroyForcibly();
      this.llamaProcess = null;
    }
  }

  @Scheduled(every = "5s")
  public void checkWatchdog() {
    if (isRunning()) {
      long elapsed = System.currentTimeMillis() - lastHeartbeat.get();
      if (elapsed > TIMEOUT_MS) {
        System.out.println("🚨 WATCHDOG TRIGGERED: No heartbeat detected for " + (elapsed / 1000) + "s.");
        stopLlama(null);
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

    if (mmprojPath != null && !mmprojPath.isBlank()) {
      Path normalizedMmproj = Paths.get(mmprojPath).toAbsolutePath();
      command.add("--mmproj");
      command.add(normalizedMmproj.toString());
      System.out.println("Vision enabled with: " + normalizedMmproj);
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
      while ((line = reader.readLine()) != null) {
        System.out.println("[Llama]: " + line);
        if (line.contains("server is listening on")) {
          System.out.println("✅ Llama Server ready on port " + SERVER_PORT);
          return;
        }
        if (line.contains("error: failed to load model")) {
          stopLlama(null);
          throw new IOException("Model failed to load.");
        }
        if (!process.isAlive()) {
          throw new IOException("Process died with exit code: " + process.exitValue());
        }
      }
    }
  }
}