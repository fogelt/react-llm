package com.example.backend;

import jakarta.enterprise.context.ApplicationScoped;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

@ApplicationScoped
public class ToolRegistry {

  public String get_system_info(Map<String, Object> args) {
    String os = System.getProperty("os.name");
    String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    String location = get_location_by_ip();

    return String.format(
        "Current Context:\n" +
            "- Operating System: %s\n" +
            "- Current Time: %s\n" +
            "- User Location: %s\n" +
            "- Java Version: %s",
        os, time, location, System.getProperty("java.version"));
  }

  // Hjälpmetod för att hitta användarens plats
  private String get_location_by_ip() {
    try {
      HttpClient client = HttpClient.newHttpClient();
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create("https://ipapi.co/city/")) // Enkel tjänst som bara returnerar stadsnamn
          .header("User-Agent", "Mozilla/5.0")
          .GET()
          .build();
      return client.send(request, HttpResponse.BodyHandlers.ofString()).body();
    } catch (Exception e) {
      return "Unknown"; // Fallback om tjänsten ligger nere
    }
  }

  public String web_search(Map<String, Object> args) {
    String query = (String) args.get("query");
    if (query == null || query.isEmpty())
      return "No query provided.";

    System.out.println("Söker på DuckDuckGo efter: " + query);

    try {
      // Vi använder DDG:s HTML-version (enklare att läsa av)
      String url = "https://html.duckduckgo.com/html/?q=" + java.net.URLEncoder.encode(query, "UTF-8");

      // Jsoup laddar sidan och simulerar en webbläsare (User-Agent är viktig!)
      Document doc = Jsoup.connect(url)
          .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
          .get();

      // Vi letar efter sökresultaten i HTML-koden
      Elements results = doc.select(".result__body");

      if (results.isEmpty())
        return "Inga resultat hittades för: " + query;

      // Vi tar de 5 första resultaten och formaterar dem snyggt för AI:n
      return results.stream()
          .limit(5)
          .map(element -> {
            String title = element.select(".result__title").text();
            String snippet = element.select(".result__snippet").text();
            return "Titel: " + title + "\nInfo: " + snippet + "\n";
          })
          .collect(Collectors.joining("\n---\n"));

    } catch (Exception e) {
      e.printStackTrace();
      return "Fel vid sökning: " + e.getMessage();
    }
  }
}