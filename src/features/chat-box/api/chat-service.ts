import { Message } from "@/types";
import { env } from '@/config/env';
import { API_ROUTES } from '@/lib/api-routes';
import { availableTools } from '@/config/available-tools'

const CHAT_API_URL = env.API_URL;

export interface ChatMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  tokensPerSecond: number;
}

export const sendChatMessage = async (content: string): Promise<{ content: string; metrics: ChatMetrics }> => {
  try {
    const startTime = Date.now(); // Start timer

    const res = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "Qwen3VL-2B-Instruct-Q4_K_M.gguf",
        messages: [{ role: "user", content }],
      }),
    });

    const data = await res.json();
    const endTime = Date.now(); // End timer

    const usage = data.usage;
    const durationSec = (endTime - startTime) / 1000;

    const tokensPerSecond = usage.completion_tokens / durationSec;

    return {
      content: data.choices[0].message.content,
      metrics: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        tokensPerSecond: parseFloat(tokensPerSecond.toFixed(2)),
      }
    };
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const streamChatMessage = async (
  messages: Message[],
  onChunk: (chunk: string) => void,
  onMetrics?: (metrics: ChatMetrics) => void,
  signal?: AbortSignal
): Promise<void> => {
  try {
    let tokenCount = 0;
    const startTime = Date.now(); // Start timer
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
        tools: availableTools,
        tool_choice: "auto",
        stream: true,
        stream_options: { include_usage: true } // REQUIRED for usage in stream
      }),
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`API error or empty body: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        // 1. Rensa raden och hoppa över om den är tom
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // 2. Extrahera JSON-delen oavsett hur många "data:"-prefix som finns
        // Detta fixar "data:data: {" felet
        const jsonString = trimmedLine.replace(/^data:\s*/g, '').replace(/^data:\s*/g, '').trim();

        if (!jsonString || jsonString === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonString);
          const chunk = json.choices?.[0]?.delta?.content || "";

          if (chunk) {
            onChunk(chunk);
            // Update live TPS based on local counter
            tokenCount++;
            const liveDuration = (Date.now() - startTime) / 1000;
            onMetrics?.({
              promptTokens: 0,
              completionTokens: tokenCount,
              totalTokens: 0,
              tokensPerSecond: parseFloat((tokenCount / liveDuration).toFixed(2)),
            });
          }

          // Handle Final Usage (Even if choices is empty)
          if (json.usage) {
            console.log("Final Metrics Captured:", json.usage);

            // Use the server's own timing if available, or calculate our own
            const tps = json.timings?.predicted_per_second || (json.usage.completion_tokens / ((Date.now() - startTime) / 1000));

            onMetrics?.({
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
              totalTokens: json.usage.total_tokens,
              tokensPerSecond: parseFloat(tps.toFixed(2)),
            });
          }
        } catch (e) { /* parse error */ }
      }
    }
  } catch (error) {
    console.error("Error streaming:", error);
    throw error;
  }
};