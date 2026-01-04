export const availableTools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Searches the internet for real-time information, current events, and facts. Use 'target: wikipedia' for factual deep-dives and 'target: reddit' for community opinions or discussions.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search keywords (e.g., 'latest space news' or 'how to fix a leaky faucet')"
          },
          target: {
            type: "string",
            enum: ["web", "reddit", "wikipedia"],
            default: "web",
            description: "Choose 'reddit' for community threads, 'wikipedia' for facts, or 'web' for general search."
          }
        },
        required: ["query"]
      }
    }
  }
];