package com.example.backend;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ChatController {

  private final RestClient restClient;

  public ChatController() {
    this.restClient = RestClient.create("http://localhost:8082");
  }

  @PostMapping(value = "/chat", produces = MediaType.APPLICATION_JSON_VALUE)
  public String proxyChat(@RequestBody Map<String, Object> payload) {
    return restClient.post()
        .uri("/v1/chat/completions")
        .contentType(MediaType.APPLICATION_JSON)
        .body(payload)
        .retrieve()
        .body(String.class);
  }
}