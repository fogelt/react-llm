package com.example.backend.chat.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class ToolRegistry {

  @jakarta.inject.Inject
  ObjectMapper objectMapper;

  public String web_search(Map<String, Object> args) {
    String query = (String) args.get("query");
    String target = (String) args.getOrDefault("target", "web");

    if (query == null || query.isEmpty())
      return "No query provided.";

    try {
      String finalQuery = query;
      if ("reddit".equalsIgnoreCase(target))
        finalQuery = "site:reddit.com " + query;
      else if ("wikipedia".equalsIgnoreCase(target))
        finalQuery = "site:wikipedia.org " + query;

      String url = "https://html.duckduckgo.com/html/?q=" + java.net.URLEncoder.encode(finalQuery, "UTF-8");

      Document doc = Jsoup.connect(url)
          .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
          .timeout(10000)
          .get();

      Elements results = doc.select(".result__body");
      if (results.isEmpty())
        return "No results found.";

      return objectMapper.writeValueAsString(results.stream()
          .limit(5)
          .map(element -> {
            Map<String, String> sourceMap = new HashMap<>();
            sourceMap.put("title", element.selectFirst(".result__a").text());
            sourceMap.put("url", element.selectFirst(".result__a").attr("href"));
            sourceMap.put("snippet", element.select(".result__snippet").text());
            return sourceMap;
          })
          .collect(Collectors.toList()));

    } catch (Exception e) {
      return "Search failed: " + e.getMessage();
    }
  }
}