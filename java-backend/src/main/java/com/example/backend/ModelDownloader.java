package com.example.backend;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
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

@Service
public class ModelDownloader {

  private final Map<String, Integer> downloadProgress = new ConcurrentHashMap<>();

  public int getProgress(String fileName) {
    return downloadProgress.getOrDefault(fileName, 0);
  }

  @Async
  public void downloadGguf(String repo, String fileName, String targetFolder) {
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

      // Handle non-OK status codes (401, 403, 404, etc)
      if (response.statusCode() != 200) {
        System.err.println("Download failed for " + fileName + ": HTTP " + response.statusCode());
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

      // Set to 100 explicitly so the frontend knows we are done
      downloadProgress.put(fileName, 100);
      System.out.println("Download complete: " + fileName);

    } catch (Exception e) {
      System.err.println("Error downloading " + fileName + ": " + e.getMessage());
      downloadProgress.put(fileName, -500);
    }
  }
}