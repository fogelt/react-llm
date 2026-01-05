import { api } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/api-routes';
import { env } from '@/config/env';

// Legacy fallback for navigator.sendBeacon
export const API_STOP_URL = env.PRIMARY_BACKEND_URL + API_ROUTES.CONFIG_STOP;

export const modelService = {
  // Fetch list of available GGUF and projector files
  getFiles: async () => {
    const data = await api.get(API_ROUTES.CONFIG_FILES) as { files: string[] };
    return data.files || [];
  },

  // Check if the Llama server is currently active
  getStatus: async () => {
    const data = await api.get(API_ROUTES.CONFIG_STATUS) as { running: boolean };
    return data.running;
  },

  // Get download percentage or error code (negative) for a file
  getDownloadStatus: async (fileName: string) => {
    const res = await api.get(`${API_ROUTES.CONFIG_DOWNLOAD_STATUS}?fileName=${fileName}`) as { progress: number };
    return res.progress;
  },

  // Trigger a model download from Hugging Face
  downloadModel: (repo: string, fileName: string) => {
    return api.post(API_ROUTES.CONFIG_DOWNLOAD, { repo, fileName });
  },

  // Launch the Llama server process
  startServer: (modelPath: string, mmprojPath: string, contextSize: string) => {
    return api.post(API_ROUTES.CONFIG_START, {
      modelPath: `downloads/${modelPath}`,
      mmprojPath: mmprojPath ? `downloads/${mmprojPath}` : "",
      contextSize,
    });
  },

  // Terminate the Llama server process
  stopServer: () => {
    return api.post(API_ROUTES.CONFIG_STOP, {});
  },

  // Send keep-alive signal to prevent backend auto-shutdown
  sendHeartbeat: () => {
    return api.post(API_ROUTES.CONFIG_HEARTBEAT, {});
  }
};