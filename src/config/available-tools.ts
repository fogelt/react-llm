export const availableTools = [
  {
    type: "function",
    function: {
      name: "get_system_info",
      description: "Hämtar systeminformation, aktuell tid och användarens geografiska plats",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Använd denna för att söka efter information på internet som du inte känner till, t.ex. dagsaktuella händelser eller specifika fakta.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Sökfrasen på svenska eller engelska" }
        },
        required: ["query"]
      }
    }
  }
];