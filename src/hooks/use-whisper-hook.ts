import { useState, useRef, useCallback } from "react";

export function useWhisper(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<number | null>(null);

  const sequenceRef = useRef(0);
  const nextExpectedRef = useRef(0);
  const pendingResults = useRef<Map<number, string>>(new Map());

  const handleOrderedResult = useCallback((id: number, text: string) => {
    pendingResults.current.set(id, text);

    while (pendingResults.current.has(nextExpectedRef.current)) {
      const textToPublish = pendingResults.current.get(nextExpectedRef.current);
      if (textToPublish !== undefined) {
        onTranscript(textToPublish);
      }

      pendingResults.current.delete(nextExpectedRef.current);
      nextExpectedRef.current++;
    }
  }, [onTranscript]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      sequenceRef.current = 0;
      nextExpectedRef.current = 0;
      pendingResults.current.clear();

      const captureChunk = () => {
        const currentId = sequenceRef.current++;
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        recorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            const formData = new FormData();
            const audioBlob = new Blob([event.data], { type: 'audio/webm' });
            formData.append('file', audioBlob, 'chunk.webm');

            try {
              const response = await fetch(`http://100.76.127.80:8000/transcribe?sequence_id=${currentId}`, {
                method: 'POST',
                body: formData,
              });

              const data = await response.json();
              handleOrderedResult(data.sequence_id, data.text);
            } catch (err) {
              console.error(`Chunk ${currentId} failed:`, err);
            }
          }
        };

        recorder.start();
        setTimeout(() => {
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }, 3000);
      };

      // Start initial chunk and set interval
      captureChunk();
      intervalRef.current = window.setInterval(captureChunk, 3000);

      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const stopRecording = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  return { isRecording, toggleRecording };
}