package com.example.backend.llama;

import io.smallrye.mutiny.Uni;
import io.smallrye.mutiny.infrastructure.Infrastructure;
import jakarta.enterprise.context.ApplicationScoped;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class ModelDownloader {

  private final Map<String, Integer> downloadProgress = new ConcurrentHashMap<>();

  public int getProgress(String fileName) {
    return downloadProgress.getOrDefault(fileName, 0);
  }

  public void downloadGguf(String repo, String fileName, String targetFolder) {
    Uni.createFrom().item(() -> {
      performDownload(repo, fileName, targetFolder);
      return null;
    })
        .runSubscriptionOn(Infrastructure.getDefaultWorkerPool())
        .subscribe().with(
            item -> System.out.println("Download started for: " + fileName),
            failure -> System.err.println("Critical failure: " + failure.getMessage()));
  }

  private void performDownload(String repo, String fileName, String targetFolder) {
    String url = String.format("https://huggingface.co/%s/resolve/main/%s", repo, fileName);

    try {
      Path targetPath = Paths.get(targetFolder, fileName);
      Files.createDirectories(targetPath.getParent());

      HttpClient client = HttpClient.newBuilder()
          .followRedirects(HttpClient.Redirect.ALWAYS)
          .build();

      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(url))
          .header("User-Agent", "Mozilla/5.0 (LlamaLocalDownloader/1.0)")
          .build();

      HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());

      if (response.statusCode() != 200) {
        downloadProgress.put(fileName, -response.statusCode());
        return;
      }

      long fileSize = response.headers().firstValueAsLong("content-length").orElse(-1L);

      try (InputStream is = response.body();
          OutputStream os = Files.newOutputStream(targetPath)) {

        byte[] buffer = new byte[8192];
        long totalRead = 0;
        int read;

        while ((read = is.read(buffer)) != -1) {
          os.write(buffer, 0, read);
          totalRead += read;
          if (fileSize > 0) {
            int progress = (int) ((totalRead * 100) / fileSize);
            downloadProgress.put(fileName, progress);
          }
        }
      }
      downloadProgress.put(fileName, 100);
    } catch (Exception e) {
      downloadProgress.put(fileName, -500);
    }
  }
}