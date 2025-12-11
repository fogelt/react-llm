# 🤖 Local LLM React UI

This project is a modern, full-stack application designed for interactive conversation with a **Local Large Language Model (LLM)**, featuring multimodal capabilities that allow users to upload and process files (Images and PDFs) directly within the chat interface.

This architecture is built on three distinct, independently running services:
1. **React UI (Client):** Runs on Vite's development server (e.g., `localhost:5173`).
2. **Local LLM Endpoint (API):** Your local LLM server (e.g., Llama.cpp) running on **`localhost:8080`**.
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

You need to have Node.js (v18+), npm, and your **Local LLM Server** (e.g., Ollama, LM Studio, etc.) running and configured to expose an API endpoint on **`http://localhost:8080`**.

### 1. Project Setup

Clone the repository and install the dependencies:

```bash
git clone <your-repo-url>
cd llm-site
npm install
```

### 2. Running the Application

This project runs two distinct processes concurrently: the React frontend (Vite) and the Node upload server.

**NOTE:** Ensure your **Local LLM Service is already running on `http://localhost:8080`** before proceeding.

```bash
npm run start:all
```

This command will:
1.  **Start the Frontend:** Runs the React application via Vite (typically at `http://localhost:5173`).
2.  **Start the Upload Server:** Runs the Node/Express file handling service (at **`http://localhost:8081`**).

---

## 💻 Tech Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | `react`, `vite`, `typescript` | Core application and build tool |
| **Styling** | `tailwindcss`, `postcss`, `autoprefixer` | Utility-first CSS framework for modern design |
| **LLM Server** | *External Service* | Hosts and serves the Local Large Language Model inference API on `:8080` |
| **Upload Server** | `express`, `cors` | Dedicated lightweight API server for file handling on `:8081` |
| **File Processing** | `multer`, `pdf-parse` | Handles file uploads and extracts text from PDFs |
| **Content Rendering** | `react-markdown` | Securely renders markdown responses from the LLM |
| **Utilities** | `axios`, `concurrently` | HTTP client and running simultaneous processes |

## 📂 Project Structure (Based on uploaded image)

```
llm-site/
├── .venv/
├── dist/
├── node_modules/
├── public/
│   ├── robots.txt
├── server/
│   ├── uploads/
│   └── upload-server.js
├── src/
│   ├── components/
│   │   ├── ChatBox.tsx
│   │   ├── ChatInput.tsx
│   │   ├── Menu.tsx
│   │   └── MessageList.tsx
│   ├── services/
│   │   └── chatService.ts
│   ├── utils/
│   │   └── chatSerializer.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── style.css
│   └── types.ts
├── .gitignore
├── eslint.config.js
├── favicon.ico
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts the React development server (`~5173`). |
| `npm run build` | `vite build` | Builds the app for production to the `dist` folder. |
| `npm run preview` | `vite preview` | Locally previews the production build. |
| `npm run start:upload` | `node public/server/upload-server.js` | **Starts the Node/Express file handling service (`8081`) using the corrected path.** |
| `npm run start:all` | `concurrently "npm run dev" "npm run start:upload"` | **Recommended.** Starts both the frontend and backend servers simultaneously. |

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License.
