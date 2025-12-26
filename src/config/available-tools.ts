export const availableTools = [
  {
    type: "function",
    function: {
      name: "get_system_info",
      description: "Get the local machine's OS and Java version",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_local_files",
      description: "List GGUF files in the downloads folder",
      parameters: {
        type: "object",
        properties: {
          folder: { type: "string", description: "The folder to scan" }
        }
      }
    }
  }
];