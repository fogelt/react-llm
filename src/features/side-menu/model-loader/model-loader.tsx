import { useState, useEffect, useCallback } from 'react';
import { TextInput, RectButton, Dropdown, ProgressBar } from '@/components/ui';
import { api } from '@/lib/api-client';
import { env } from '@/config/env';
import { API_ROUTES } from '@/lib/api-routes';
import { useError } from '@/errors/error-context';

const API_STOP_URL = env.API_URL + API_ROUTES.CONFIG_STOP;
const POLLING_INTERVAL = 10000;

const CURATED_MODELS = [
  {
    name: "Qwen3-VL 2B",
    repo: "Qwen/Qwen3-VL-2B-Instruct-GGUF",
    file: "Qwen3VL-2B-Instruct-Q4_K_M.gguf",
    mmproj: "mmproj-Qwen3VL-2B-Instruct-Q8_0.gguf"
  }
];

interface ModelLoaderProps {
  contextSize: string;
  setContextSize: (val: string) => void;
}

export function ModelLoader({ contextSize, setContextSize }: ModelLoaderProps) {
  const { showError } = useError();
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [modelFile, setModelFile] = useState('');
  const [mmprojFile, setMmprojFile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [activeDownloadFile, setActiveDownloadFile] = useState<string | null>(null);

  const refreshFiles = useCallback(async () => {
    try {
      const data = await api.get('/api/config/files') as { files: string[] };
      setAvailableFiles(data.files || []);
    } catch (error) {
      console.error("Could not fetch local files");
    }
  }, []);

  const stopDownload = useCallback(() => {
    setIsDownloading(false);
    setActiveDownloadFile(null);
    setDownloadProgress(0);
  }, []);

  // Poll for progress - unified error handling and data access
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isDownloading && activeDownloadFile) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/api/config/download-status?fileName=${activeDownloadFile}`) as any;
          const progress = res.progress;

          if (progress < 0) {
            const errorCode = Math.abs(progress);
            const errorMsg = errorCode === 401
              ? "Authentication failed: Hugging Face requires a token for this model."
              : `Download failed with error code: ${errorCode}`;

            showError(errorMsg);
            stopDownload();
          } else {
            setDownloadProgress(progress);
            if (progress >= 100) {
              stopDownload();
              refreshFiles();
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isDownloading, activeDownloadFile, showError, stopDownload, refreshFiles]);

  const checkServerStatus = useCallback(async () => {
    try {
      const statusData = (await api.get(API_ROUTES.CONFIG_STATUS)) as any;
      setIsRunning(statusData.running);
    } catch (error) {
      setIsRunning(false);
    }
  }, []);

  const handleDownload = async (model: any) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setActiveDownloadFile(model.file);

    try {
      await api.post('/api/config/download', {
        repo: model.repo,
        fileName: model.file
      });

      if (model.mmproj) {
        await api.post('/api/config/download', {
          repo: model.repo,
          fileName: model.mmproj
        });
      }
    } catch (err) {
      showError("Could not start download.");
      setIsDownloading(false);
    }
  };

  const handleStartServer = async () => {
    if (!modelFile) {
      showError("Please select a GGUF model first.");
      return;
    }
    setIsLoading(true);
    try {
      await api.post(API_ROUTES.CONFIG_START, {
        modelPath: `downloads/${modelFile}`,
        mmprojPath: mmprojFile ? `downloads/${mmprojFile}` : "",
        contextSize: contextSize,
      });
      setIsRunning(true);
    } catch (error: any) {
      showError(`Server Start Failed: ${error.response?.data?.message || 'Check model'}`);
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
      showError("Failed to stop server.");
      setIsRunning(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopServerCallOnUnload = useCallback(() => {
    if (isRunning) {
      navigator.sendBeacon(API_STOP_URL, JSON.stringify({}));
    }
  }, [isRunning]);

  useEffect(() => {
    refreshFiles();
    checkServerStatus();
    const intervalId = setInterval(checkServerStatus, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [checkServerStatus, refreshFiles]);

  useEffect(() => {
    if (isRunning) {
      window.addEventListener('beforeunload', handleStopServerCallOnUnload);
    }
    return () => window.removeEventListener('beforeunload', handleStopServerCallOnUnload);
  }, [isRunning, handleStopServerCallOnUnload]);

  return (
    <div className="flex flex-col mt-4 p-4 glass">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-bold">Model Configuration</h3>
        <button onClick={refreshFiles} className="text-[10px] text-slate-300 font-bold uppercase">
          <span className="material-icons !text-[16px] -translate-x-[5px]" aria-hidden>refresh</span>
        </button>
      </div>

      <div className="mt-2 pl-2 pb-2 rounded-lg glass border border-white/10">
        <label className="text-[10px] uppercase text-slate-300 font-bold">Quick Download</label>
        <div className="flex flex-col gap-2 mt-1 items-start">
          {CURATED_MODELS.map(m => {
            const isDownloaded = availableFiles.includes(m.file) && (!m.mmproj || availableFiles.includes(m.mmproj));
            return (
              <button
                key={m.file}
                disabled={isDownloading || isDownloaded}
                onClick={() => handleDownload(m)}
                className={`
                  text-[10px] px-2.5 py-1 rounded-[6px] transition-all duration-200 font-medium
                  ${isDownloaded
                    ? 'glass bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 cursor-default'
                    : 'glass hover:bg-emerald-900/40 text-white border border-transparent'
                  }
                    ${isDownloading && !isDownloaded ? 'opacity-50 cursor-wait' : ''}
                    `}
              >
                <span className="flex items-center gap-1.5">
                  {isDownloaded ? (
                    <>
                      <span className="material-icons !text-[16px] text-emerald-400 -translate-x-[5px]" aria-hidden>download_done</span>
                      <span className="text-slate-300">{m.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons !text-[16px] -translate-x-[5px]" aria-hidden>download</span>
                      {m.name}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Dropdown
        label="Model"
        value={modelFile}
        setValue={setModelFile}
        options={availableFiles}
      />

      <Dropdown
        label="Vision Projector"
        value={mmprojFile}
        setValue={setMmprojFile}
        options={availableFiles}
      />

      {!isDownloading && (
        <>
          <label className="mb-1 mt-4 text-[11px] font-bold text-slate-300 mb-1.5 ml-1 uppercase tracking-widest">Context Size</label>
          <TextInput
            type="text"
            value={contextSize}
            onChange={(e) => setContextSize(e.target.value)}
            className="p-2 text-xs bg-gray-700/50 !rounded-[10px]"
          />
        </>
      )}
      {isDownloading && (
        <div className="mt-8 mb-2 animate-in fade-in slide-in-from-top-1">
          <ProgressBar
            current={downloadProgress}
            label={`Fetching ${activeDownloadFile}`}
          />
        </div>
      )}
      <RectButton
        className='mt-5'
        isLoading={isLoading || isDownloading}
        isDestructive={isRunning}
        onClick={isRunning ? handleStopServer : handleStartServer}
      >
        {isRunning ? (isLoading ? 'Stopping...' : 'Stop Llama Server') :
          isDownloading ? 'Downloading Model...' : (isLoading ? 'Starting...' : 'Start Llama Server')}
      </RectButton>
    </div>
  );
}