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
    String target = (String) args.getOrDefault("target", "web"); // "web", "reddit", or "wikipedia"

    if (query == null || query.isEmpty())
      return "No query provided.";

    try {
      String finalQuery = query;
      if ("reddit".equalsIgnoreCase(target)) {
        finalQuery = "site:reddit.com " + query;
      } else if ("wikipedia".equalsIgnoreCase(target)) {
        finalQuery = "site:wikipedia.org " + query;
      }

      String url = "https://html.duckduckgo.com/html/?q=" + java.net.URLEncoder.encode(finalQuery, "UTF-8");
      Document doc = Jsoup.connect(url)
          .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
          .timeout(10000)
          .get();

      Elements results = doc.select(".result__body");
      if (results.isEmpty())
        return "No results found for: " + query + " on " + target;

      // Format and label the output
      return results.stream()
          .limit(5)
          .map(element -> {
            String title = element.select(".result__title").text();
            String snippet = element.select(".result__snippet").text();
            String source = "General Web";
            if (title.toLowerCase().contains("reddit"))
              source = "Reddit";
            if (title.toLowerCase().contains("wikipedia"))
              source = "Wikipedia";

            return String.format("[%s] %s\nInfo: %s\n", source, title, snippet);
          })
          .collect(Collectors.joining("\n---\n"));

    } catch (Exception e) {
      return "Search failed: " + e.getMessage();
    }
  }
}