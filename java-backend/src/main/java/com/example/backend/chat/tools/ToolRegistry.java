package com.example.backend.chat.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

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
          .userAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
          .timeout(10000)
          .get();

      // Specifically target the main result links to avoid ads/sidebars
      Elements results = doc.select(".result__body");

      if (results.isEmpty())
        return "No results found.";

      // Only take the first result to maintain the "one source per step" logic
      Element element = results.first();
      Element linkElement = element.selectFirst(".result__a");

      if (linkElement == null)
        return "No valid result link found.";

      Map<String, String> sourceMap = new HashMap<>();
      sourceMap.put("title", linkElement.text());
      sourceMap.put("url", linkElement.attr("href"));
      sourceMap.put("snippet", element.select(".result__snippet").text());

      // Wrap in a list so the frontend JSON parser still sees an array
      return objectMapper.writeValueAsString(Collections.singletonList(sourceMap));

    } catch (Exception e) {
      return "Search failed: " + e.getMessage();
    }
  }
}