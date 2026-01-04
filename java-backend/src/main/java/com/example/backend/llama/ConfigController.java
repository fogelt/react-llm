package com.example.backend.llama;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Path("/api/config")
public class ConfigController {

  @Inject
  LlamaRunner llamaRunner;

  @Inject
  ModelDownloader modelDownloader;

  @POST
  @Path("/download")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response downloadModel(Map<String, String> request) {
    try {
      String repo = request.get("repo");
      String fileName = request.get("fileName");
      String targetDir = "downloads";

      modelDownloader.downloadGguf(repo, fileName, targetDir);

      return Response.ok(Map.of("message", "Model download started for " + targetDir)).build();
    } catch (Exception e) {
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
          .entity(Map.of("message", "Download failed: " + e.getMessage())).build();
    }
  }

  @GET
  @Path("/download-status")
  @Produces(MediaType.APPLICATION_JSON)
  public Map<String, Integer> getDownloadStatus(@QueryParam("fileName") String fileName) {
    return Map.of("progress", modelDownloader.getProgress(fileName));
  }

  @GET
  @Path("/files")
  @Produces(MediaType.APPLICATION_JSON)
  public Response listAvailableFiles() {
    java.nio.file.Path downloadPath = Paths.get("downloads");
    try {
      if (!Files.exists(downloadPath))
        Files.createDirectories(downloadPath);

      try (var stream = Files.list(downloadPath)) {
        List<String> files = stream
            .map(path -> path.getFileName().toString())
            .filter(name -> name.endsWith(".gguf"))
            .toList();
        return Response.ok(Map.of("files", files)).build();
      }
    } catch (IOException e) {
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
          .entity(Map.of("files", List.of())).build();
    }
  }

  @POST
  @Path("/start")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response startServer(Map<String, String> config) {
    try {
      String modelPath = config.get("modelPath");
      String mmprojPath = config.get("mmprojPath");
      String contextSize = config.getOrDefault("contextSize", "1024");

      if (modelPath == null || modelPath.isBlank()) {
        return Response.status(Response.Status.BAD_REQUEST)
            .entity(Map.of("message", "Model path is required.")).build();
      }

      if (llamaRunner.isRunning()) {
        llamaRunner.stopLlama(null); // Passing null since we call it manually
      }

      llamaRunner.startLlama(modelPath, mmprojPath, contextSize);

      return Response.ok(Map.of(
          "message", "Server started successfully",
          "port", llamaRunner.SERVER_PORT != null ? llamaRunner.SERVER_PORT : "unknown")).build();

    } catch (IllegalStateException e) {
      return Response.status(Response.Status.CONFLICT)
          .entity(Map.of("message", e.getMessage())).build();
    } catch (IOException e) {
      return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
          .entity(Map.of("message", "Backend Error: " + e.getMessage())).build();
    }
  }

  @POST
  @Path("/stop")
  @Produces(MediaType.APPLICATION_JSON)
  public Response stopServer() {
    llamaRunner.stopLlama(null);
    return Response.ok(Map.of("message", "Llama server stopped.")).build();
  }

  @GET
  @Path("/status")
  @Produces(MediaType.APPLICATION_JSON)
  public Map<String, Object> getStatus() {
    return Map.of(
        "running", llamaRunner.isRunning(),
        "modelPath", llamaRunner.getCurrentModelPath() != null ? llamaRunner.getCurrentModelPath() : "",
        "os", System.getProperty("os.name"));
  }

  @POST
  @Path("/heartbeat")
  public Response heartbeat() {
    llamaRunner.resetHeartbeat();
    return Response.ok().build();
  }
}