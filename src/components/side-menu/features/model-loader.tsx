import React, { useState, useEffect } from 'react';
import { TextInput } from '@/components/ui';
import { RectButton } from '@/components/ui';

const DEFAULT_MODEL_PATH = "C:\\Users\\edvin\\Downloads\\Qwen3-VL-2B-Instruct-Q4_K_M.gguf";
const DEFAULT_MMPROJ_PATH = "C:\\Users\\edvin\\Downloads\\mmproj-BF16.gguf";
const DEFAULT_CONTEXT_SIZE = "1024"

const API_CONFIG_URL = 'http://localhost:8080/api/config/start';
const API_STATUS_URL = 'http://localhost:8080/api/config/status';
const API_STOP_URL = 'http://localhost:8080/api/config/stop';
const POLLING_INTERVAL = 10000;

export function ModelLoader() {
  const [modelPath, setModelPath] = useState(DEFAULT_MODEL_PATH);
  const [mmprojPath, setMmprojPath] = useState(DEFAULT_MMPROJ_PATH);
  const [contextSize, setContextSize] = useState(DEFAULT_CONTEXT_SIZE)
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const checkServerStatus = async () => {
    try {
      const response = await fetch(API_STATUS_URL);
      if (response.ok) {
        const statusData = await response.json();
        setIsRunning(statusData.running);
      } else {
        setIsRunning(false);
      }
    } catch (error) {
      setIsRunning(false);
    }
  };

  const handleStartServer = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(API_CONFIG_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelPath: modelPath,
          mmprojPath: mmprojPath,
          contextSize: contextSize
        }),
      });

      const resultText = await response.text();

      if (response.ok) {
        setIsRunning(true);
      } else {
        let message = resultText;
        try {
          const errorBody = JSON.parse(resultText);
          message = errorBody.error || errorBody.message || 'Unknown error';
        } catch {
          window.alert("Server Start Failed:" + message);
          setIsRunning(false);
        }
      }
    } catch (error) {
      window.alert("Network Error:" + error);
      setIsRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopServer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_STOP_URL, { method: 'POST' });
      if (response.ok) {
        setIsRunning(false);
      }
    } catch (error) {
      window.alert("Failed to stop server");
      setIsRunning(true);
    } finally {
      setIsLoading(false);
    }
  };

  // --- BROWSER EXIT HANDLER (using sendBeacon) ---
  const handleStopServerCallOnUnload = () => {
    if (isRunning) {
      const data = JSON.stringify({});
      navigator.sendBeacon(API_STOP_URL, data);
    }
  };

  useEffect(() => {
    checkServerStatus();

    const intervalId = setInterval(checkServerStatus, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isRunning) {
      window.addEventListener('beforeunload', handleStopServerCallOnUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleStopServerCallOnUnload);
    };
  }, [isRunning]);

  return (
    <div className="flex flex-col mt-4 p-4 glass">
      <h3 className="font-bold mb-3">Model Configuration</h3>

      <label className="text-sm mb-1 mt-2">GGUF Model Path</label>
      <TextInput
        type="text"
        value={modelPath}
        onChange={(e) => setModelPath(e.target.value)}
        className="p-2 text-xs bg-gray-700/50 !rounded-[10px] !pl-[5px]"
        placeholder="C:\path\to\model.gguf"
      />

      <label className="text-sm mb-1 mt-3">MMProj Path</label>
      <TextInput
        type="text"
        value={mmprojPath}
        onChange={(e) => setMmprojPath(e.target.value)}
        className="p-2 text-xs bg-gray-700/50 !rounded-[10px] !pl-[5px]"
        placeholder="C:\path\to\mmproj.gguf"
      />

      <label className="text-sm mb-1 mt-3">Context Size</label>
      <TextInput
        type="text"
        value={contextSize}
        onChange={(e) => setContextSize(e.target.value)}
        className="p-2 text-xs bg-gray-700/50 !rounded-[10px] !pl-[5px]"
        placeholder="1024"
      />

      <RectButton
        className='mt-4'
        isLoading={isLoading}
        isDestructive={isRunning}
        onClick={isRunning ? handleStopServer : handleStartServer}
      >
        {isRunning
          ? (isLoading ? 'Stopping...' : 'Stop Llama Server')
          : (isLoading ? 'Starting...' : 'Start Llama Server')
        }
      </RectButton>
    </div>
  );
}