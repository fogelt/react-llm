import React, { useState } from 'react';

const DEFAULT_MODEL_PATH = "C:\\Users\\edvin\\Downloads\\Qwen3-VL-2B-Instruct-Q4_K_M.gguf";
const DEFAULT_MMPROJ_PATH = "C:\\Users\\edvin\\Downloads\\mmproj-BF16.gguf";
const API_CONFIG_URL = 'http://localhost:8080/api/config/start';

export function ModelLoader() {
  const [modelPath, setModelPath] = useState(DEFAULT_MODEL_PATH);
  const [mmprojPath, setMmprojPath] = useState(DEFAULT_MMPROJ_PATH);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartServer = async () => {
    setIsLoading(true);
    setStatusMessage('Attempting to start Llama server...');

    try {
      const response = await fetch(API_CONFIG_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelPath: modelPath,
          mmprojPath: mmprojPath
        }),
      });

      const resultText = await response.text();

      if (response.ok) {
        setStatusMessage('✅ Server started successfully!');
      } else {
        // Determine the error for the status message
        let message = resultText;
        try {
          const errorBody = JSON.parse(resultText);
          message = errorBody.error || errorBody.message || 'Unknown error';
        } catch { } // Ignore parsing error if the response wasn't JSON

        setStatusMessage(`❌ Error starting server: ${message}`);
        console.error("Server Start Failed:", message);
      }
    } catch (error) {
      setStatusMessage(`❌ Network error: Could not connect to Java backend (8080).`);
      console.error("Network Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine status style
  const getStatusStyle = (message: string) => {
    if (message.startsWith('✅')) {
      return 'bg-green-700/50 text-green-300';
    } else if (message.startsWith('❌')) {
      return 'bg-red-700/50 text-red-300';
    }
    return 'text-gray-300';
  };

  return (
    <div className="flex flex-col mt-4 p-4 glass">
      <h3 className="font-bold mb-3">Model Configuration</h3>

      <label className="text-sm mb-1 mt-2">GGUF Model Path (-m)</label>
      <input
        type="text"
        value={modelPath}
        onChange={(e) => setModelPath(e.target.value)}
        className="p-2 text-xs bg-gray-700/50 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="C:\path\to\model.gguf"
      />

      <label className="text-sm mb-1 mt-3">MMProj Path (--mmproj)</label>
      <input
        type="text"
        value={mmprojPath}
        onChange={(e) => setMmprojPath(e.target.value)}
        className="p-2 text-xs bg-gray-700/50 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="C:\path\to\mmproj.gguf"
      />

      <button
        className={`mt-4 ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'btn normal-button'} glass`}
        onClick={handleStartServer}
        disabled={isLoading}
      >
        {isLoading ? 'Starting...' : 'Start Llama Server'}
      </button>

      {statusMessage && (
        <p className={`mt-3 text-xs p-2 rounded ${getStatusStyle(statusMessage)}`}>
          {statusMessage}
        </p>
      )}
    </div>
  );
}