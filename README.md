# 🤖 Local LLM Multimodal Chat Application

This project is a modern, full-stack application designed for interactive conversation with a **Local Large Language Model (LLM)**, featuring multimodal capabilities that allow users to upload and process files (Images and PDFs) directly within the chat interface.

This architecture is built on three distinct, independently running services:
1. **React UI (Client):** Runs on Vite's development server (e.g., `localhost:5173`).
2. **Local LLM Endpoint (API):** Your local LLM server (e.g., Ollama, LM Studio) running on **`localhost:8080`**.
3. **File Upload Server (Service):** A dedicated Node/Express server for file processing running on **`localhost:8081`**.


## ✨ Features

* **Local LLM Integration:** Communicates with a local LLM API running on **`http://localhost:8080`**, ensuring privacy and control over the model being used.
* **Three-Component Architecture:** Clear separation between the UI, file handling logic, and the core LLM inference service.
* **Multimodal Input:** Ability to upload and process two types of files:
    * **Images:** Converted to Base64 format and sent to the Local LLM for visual understanding.
    * **PDFs:** Text content is extracted server-side by the Upload Server (`8081`) and sent as contextual data to the LLM (`8080`) for summarization and querying.
* **Real-time Chat:** Seamless, streaming responses from the LLM endpoint.
* **Modern Frontend Stack:** Built with React (using Vite) and styled with Tailwind CSS/PostCSS for a responsive, modern glass-morphism aesthetic.

## 🚀 Getting Started

### Prerequisites

You need to have Node.js (v18+), npm, and your **Local LLM Server** (e.g., Llama.cpp) running and configured to expose an API endpoint on **`http://localhost:8080`**.

### Project Setup

Clone the repository and install the dependencies:

```bash
git clone <your-repo-url>
cd llm-site
npm install
```
