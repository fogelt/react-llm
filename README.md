An all-in-one WebUI for running local Large Language Models (LLMs) with ease.



## 🚀 Overview
This repository provides a complete stack for local AI interaction. It includes a modern **React + Vite** frontend and a specialized **Java-backend** that manages curated model downloads and execution.

* **Frontend:** React 19, TailwindCSS, Lucide Icons.
* **Upload Server:** Node.js/Express for document processing (PDF, Images).
* **Model Engine:** Java-based backend for model orchestration.

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js** (v18+)
* **Yarn**
* **Java JRE/JDK** (for the model backend)

### Installation
1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd llm-site
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

---

## ⚡ Running the App

To launch the frontend, the upload server, and the Java backend simultaneously:

```bash
yarn start:all
```

### Available Scripts
| Command | Description |
| :--- | :--- |
| `yarn dev` | Starts the Vite development server |
| `yarn start:upload` | Starts the Node.js file processing server |
| `yarn start:backend` | Launches the Java-backend model handler |
| `yarn start:all` | Runs all of the above concurrently |

---

## 📦 Tech Stack
* **UI:** React 19, Vite, TailwindCSS
* **Backend:** Java (Model Management), Express (File Uploads)
* **Processing:** PDF-parse, Sharp (Image processing), Zod (Validation)
