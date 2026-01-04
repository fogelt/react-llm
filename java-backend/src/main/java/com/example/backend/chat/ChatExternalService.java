package com.example.backend.chat;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import io.smallrye.mutiny.Multi;

@Path("/v1")
@RegisterRestClient(configKey = "chat-api")
public interface ChatExternalService {

  @POST
  @Path("/chat/completions")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  ChatResponse getChatCompletion(Map<String, Object> payload);

  @POST
  @Path("/chat/completions")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.SERVER_SENT_EVENTS)
  Multi<String> streamChatCompletion(Map<String, Object> payload);
}