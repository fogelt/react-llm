export const availableTools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Use this to search for information on the internet that you are not aware of, such as current events or specific facts.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query in any language you deem best suited."
          }
        },
        required: ["query"]
      }
    }
  }
];