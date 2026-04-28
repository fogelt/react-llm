import { useState, useRef, useCallback } from "react";
import { whisperService } from "@/features/chat-box/api/whisper-service";

export function useWhisper(onTranscript: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 }
      });

      whisperService.connect(onTranscript);

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          whisperService.sendAudio(event.data);
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    whisperService.disconnect();
    setIsRecording(false);
  }, []);

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  return { isRecording, toggleRecording };
}