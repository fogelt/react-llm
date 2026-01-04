package com.example.backend.chat.tools;

import jakarta.enterprise.context.ApplicationScoped;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class ToolRegistry {

  public String web_search(Map<String, Object> args) {
    String query = (String) args.get("query");
    if (query == null || query.isEmpty())
      return "No query provided.";

    System.out.println("Searching DuckDuckGo for: " + query);

    try {
      String url = "https://html.duckduckgo.com/html/?q=" + java.net.URLEncoder.encode(query, "UTF-8");

      Document doc = Jsoup.connect(url)
          .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
          .get();

      Elements results = doc.select(".result__body");

      if (results.isEmpty())
        return "Inga resultat hittades för: " + query;

      // Format first 5 results
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