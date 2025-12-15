import { Message } from "@/types/types";
import { env } from '@/config/env';
import { API_ROUTES } from '@/lib/api-routes';

const CHAT_API_URL = env.API_URL + API_ROUTES.CHAT_COMPLETIONS;

export const sendChatMessage = async (content: string): Promise<string> => {
  try {
    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen3VL-2B-Instruct-Q4_K_M.gguf",
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return (data as any).choices[0].message.content;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const streamChatMessage = async (
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<void> => {
  try {
    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "Qwen3VL-2B-Instruct-Q4_K_M.gguf",
        messages: messages.map(message => {
          if (message.images?.length) {
            return {
              role: message.role,
              content: [
                { type: "text", text: "Analyze this image" },
                { type: "image_url", image_url: { url: message.images?.[0] ?? "" } }
              ]
            };
          } else {
            return {
              role: message.role,
              content: message.content + (message.extraContext ? "\n" + message.extraContext : "")
            };
          }
        }),
        stream: true,
      }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const json = JSON.parse(data);
            const chunk = json.choices?.[0]?.delta?.content || "";
            if (chunk) {
              onChunk(chunk);
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error streaming message:", error);
    throw error;
  }
};