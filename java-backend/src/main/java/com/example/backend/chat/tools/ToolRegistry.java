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
import java.util.Set;

@ApplicationScoped
public class ToolRegistry {

  @jakarta.inject.Inject
  ObjectMapper objectMapper;

  public String web_search(Map<String, Object> args, Set<String> seenUrls) {
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

      // 1. FILTER: Look specifically for 'organic' results as seen in your screenshot
      // This ignores 'ad' and 'images' layouts.
      Elements organicResults = doc.select("li[data-layout='organic']");

      if (organicResults.isEmpty()) {
        // Fallback for different DDG versions
        organicResults = doc.select(".result__body:not(.result--ad)");
      }

      // 2. FIND NEW CONTENT: Skip results the AI has already seen in this loop
      Element bestResult = null;
      for (Element res : organicResults) {
        Element link = res.selectFirst(".result__a");
        if (link == null)
          continue;

        String linkUrl = link.attr("href");
        if (!seenUrls.contains(linkUrl)) {
          bestResult = res;
          break;
        }
      }

      if (bestResult == null)
        return "No new results found. All top results have already been analyzed.";

      Element finalLink = bestResult.selectFirst(".result__a");
      Map<String, String> sourceMap = new HashMap<>();
      sourceMap.put("title", finalLink.text());
      sourceMap.put("url", finalLink.attr("href"));
      sourceMap.put("snippet", bestResult.select(".result__snippet").text());

      return objectMapper.writeValueAsString(Collections.singletonList(sourceMap));

    } catch (Exception e) {
      return "Search failed: " + e.getMessage();
    }
  }
}