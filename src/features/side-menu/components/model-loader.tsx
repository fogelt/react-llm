import { useState, useEffect, useCallback } from 'react';
import { RangeSlider, RectButton, Dropdown, ProgressBar } from '@/components/ui';
import { modelService } from '../api/model-service';
import { CURATED_MODELS } from '@/config/curated-models';
import { useError } from '@/errors/error-context';

const POLLING_INTERVAL = 10000;

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
      const files = await modelService.getFiles();
      setAvailableFiles(files);
    } catch (error) {
      console.error("Could not fetch local files");
    }
  }, []);

  const stopDownload = useCallback(() => {
    setIsDownloading(false);
    setActiveDownloadFile(null);
    setDownloadProgress(0);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDownloading && activeDownloadFile) {
      interval = setInterval(async () => {
        try {
          const progress = await modelService.getDownloadStatus(activeDownloadFile);
          if (progress < 0) {
            const errorCode = Math.abs(progress);
            showError(errorCode === 401 ? "Authentication failed: Hugging Face requires a token." : `Download failed: ${errorCode}`);
            stopDownload();
          } else {
            setDownloadProgress(progress);
            if (progress >= 100) {
              stopDownload();
              refreshFiles();
            }
          }
        } catch (err) { console.error("Polling error:", err); }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDownloading, activeDownloadFile, showError, stopDownload, refreshFiles]);

  const checkServerStatus = useCallback(async () => {
    try {
      const running = await modelService.getStatus();
      setIsRunning(running);
    } catch (error) { setIsRunning(false); }
  }, []);

  const handleDownload = async (model: any) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setActiveDownloadFile(model.file);
    try {
      await modelService.downloadModel(model.repo, model.file);
      if (model.mmproj) await modelService.downloadModel(model.repo, model.mmproj);
    } catch (err) {
      showError("Could not start download.");
      setIsDownloading(false);
    }
  };

  const handleStartServer = async () => {
    if (!modelFile) { showError("Please select a GGUF model first."); return; }
    setIsLoading(true);
    try {
      await modelService.startServer(modelFile, mmprojFile, contextSize);
      setIsRunning(true);
    } catch (error: any) {
      showError(`Server Start Failed: ${error.response?.data?.message || 'Check model'}`);
      setIsRunning(false);
    } finally { setIsLoading(false); }
  };

  const handleStopServer = async () => {
    setIsLoading(true);
    try {
      await modelService.stopServer();
      setIsRunning(false);
    } catch (error) {
      showError("Failed to stop server.");
      setIsRunning(true);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    refreshFiles();
    checkServerStatus();

    const intervalId = setInterval(async () => {
      await checkServerStatus();
      if (isRunning) {
        try {
          await modelService.sendHeartbeat();
        } catch (e) {
          console.error("Backend heartbeat failed");
        }
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [checkServerStatus, refreshFiles, isRunning]);

  return (
    <div className="flex flex-col mt-4 p-4 glass">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-bold">Model Configuration</h3>
      </div>

      <div className="mt-2 pl-2 pb-2 glass">
        <label className="text-[10px] uppercase text-slate-300 font-bold">Quick Download</label>
        <div className="flex flex-col gap-2 my-1 items-start">
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
                    : 'glass hover:bg-emerald-900/40 text-white border border-transparent'}
                  ${isDownloading && !isDownloaded ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                <span className="flex items-center gap-1.5">
                  {isDownloaded ? (
                    <>
                      <span className="material-icons !text-[16px] text-emerald-300 -translate-x-[5px]" aria-hidden>download_done</span>
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

      <Dropdown label="Model" value={modelFile} setValue={setModelFile} options={availableFiles} />
      <Dropdown label="Vision Projector" value={mmprojFile} setValue={setMmprojFile} options={availableFiles} />

      {!isDownloading && (
        <RangeSlider
          label="Context Size"
          value={contextSize}
          min={1024}
          max={32768}
          step={1024}
          disabled={isRunning || isLoading}
          onChange={(val) => setContextSize(val)}
        />
      )}

      {isDownloading && (
        <div className="mt-8 mb-2 animate-in fade-in slide-in-from-top-1">
          <ProgressBar current={downloadProgress} label={`Fetching ${activeDownloadFile}`} />
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