export const availableTools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the internet for real-time info. IMPORTANT: Use ONE search at a time to reason through complex questions. Analyze the result before deciding if another search is needed.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Specific, targeted search keywords. Avoid broad terms; be precise to get the best snippet."
          },
          target: {
            type: "string",
            enum: ["web", "reddit", "wikipedia"],
            default: "web",
            description: "Choose 'reddit' for community opinions, 'wikipedia' for encyclopedia facts, or 'web' for general news/sites."
          },
          reasoning: {
            type: "string",
            description: "Briefly state why this specific search is necessary for the current step of your investigation."
          }
        },
        required: ["query", "reasoning"]
      }
    }
  }
];