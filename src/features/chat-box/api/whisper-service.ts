export class WhisperService {
  private ws: WebSocket | null = null;
  private url: string = "ws://localhost:8001/ws/whisper";

  connect(onMessage: (text: string) => void) {
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data.text);
    };
    this.ws.onclose = () => console.log("Whisper disconnected");
    this.ws.onerror = (err) => console.error("Whisper error:", err);
  }

  sendAudio(data: Blob | ArrayBuffer) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const whisperService = new WhisperService();