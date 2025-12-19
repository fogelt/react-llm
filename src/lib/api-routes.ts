export const API_ROUTES = {
  CHAT_COMPLETIONS: '/v1/chat/completions',
  CONFIG_START: '/api/config/start',
  CONFIG_STATUS: '/api/config/status',
  CONFIG_STOP: '/api/config/stop',
  CONFIG_HEARTBEAT: '/api/config/heartbeat',
  CONFIG_FILES: '/api/config/files',
  CONFIG_DOWNLOAD: '/api/config/download',
  CONFIG_DOWNLOAD_STATUS: '/api/config/download-status',
  UPLOAD_FILE: '/api/upload',
} as const;