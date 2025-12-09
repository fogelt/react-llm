import { ChangeEvent, FormEvent, useRef } from "react";

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  isLoading?: boolean;
  onUpload?: (file: File) => void;
};

export function ChatInput({ value, onChange, onSend, isLoading = false, onUpload }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoading && value.trim()) onSend();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f && onUpload) {
      onUpload(f);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form className="chat-input-container" onSubmit={handleSubmit} aria-label="Chat input form">
      <button
        type="button"
        className="upload-button"
        onClick={handleUploadClick}
        aria-label="Upload file"
        title="Upload file"
      >
        <span className="material-icons" aria-hidden>add</span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        aria-hidden
      />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Type your message..."
        disabled={isLoading}
        className="chat-input"
        aria-label="Message"
        autoComplete="off"
      />

      <button
        type="submit"
        aria-label="Send message"
        disabled={isLoading || !value.trim()}
        className="chat-button"
      >
        {isLoading ? (
          <span className="material-icons" aria-hidden>hourglass_top</span>
        ) : (
          <span className="material-icons" aria-hidden>send</span>
        )}
      </button>
    </form>
  );
}
