import { useState, useEffect, useCallback } from 'react';
import { TextInput } from '@/components/ui';
import { RectButton } from '@/components/ui';

import { api } from '@/lib/api-client';
import { env } from '@/config/env';
import { API_ROUTES } from '@/lib/api-routes';

const DEFAULT_MODEL_PATH = "C:\\Users\\edvin\\Downloads\\Qwen3-VL-2B-Instruct-Q4_K_M.gguf";
const DEFAULT_MMPROJ_PATH = "C:\\Users\\edvin\\Downloads\\mmproj-BF16.gguf";

const API_STOP_URL = env.API_URL + API_ROUTES.CONFIG_STOP;
const POLLING_INTERVAL = 10000;

interface ModelLoaderProps {
  contextSize: string;
  setContextSize: (val: string) => void;
}

export function ModelLoader({ contextSize, setContextSize }: ModelLoaderProps) {
  const [modelPath, setModelPath] = useState(DEFAULT_MODEL_PATH);
  const [mmprojPath, setMmprojPath] = useState(DEFAULT_MMPROJ_PATH);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const checkServerStatus = useCallback(async () => {
    try {
      const statusData = (await api.get(API_ROUTES.CONFIG_STATUS)) as any;

      setIsRunning(statusData.running);
    } catch (error) {
      // The API client's interceptor will log the error globally.
      setIsRunning(false);
    }
  }, []); // Empty dependency array means this function is created once

  const handleStartServer = async () => {
    setIsLoading(true);

    try {
      await api.post(API_ROUTES.CONFIG_START, {
        modelPath: modelPath,
        mmprojPath: mmprojPath,
        contextSize: contextSize,
      });

      // If the API client returns successfully (status 2xx), we know it started.
      setIsRunning(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to start server';
      window.alert("Server Start Failed: " + message);
      setIsRunning(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopServer = async () => {
    setIsLoading(true);
    try {
      await api.post(API_ROUTES.CONFIG_STOP, {});
      setIsRunning(false);
    } catch (error) {
      window.alert("Failed to stop server");
      setIsRunning(true);
    } finally {
      setIsLoading(false);
    }
  };

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
  }, [checkServerStatus]);

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