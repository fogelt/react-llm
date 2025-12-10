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
    <form className="flex relative items-center" onSubmit={handleSubmit}>
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
        className="chat-input glass w-full rounded-[20px] text-base font-sans py-[0.6rem] pr-[3.8rem] pl-[3.6rem]"
        aria-label="Message"
        autoComplete="off"
      />
      <button
        type="button"
        className="btn circle-button glass left-[10px]"
        onClick={handleUploadClick}
        aria-label="Upload file"
        title="Upload file"
      >
        <span className="material-icons !text-[16px]" aria-hidden>add</span>
      </button>
      <button
        type="submit"
        aria-label="Send message"
        disabled={isLoading || !value.trim()}
        className="btn circle-button glass right-[10px]">

        {isLoading ? (
          <span className="material-icons !text-[16px] animate-spin" aria-hidden>hourglass_top</span>
        ) : (
          <span className="material-icons !text-[16px] -translate-x-[-2px] -translate-y-[0.5px]" aria-hidden>send</span>
        )}
      </button>
    </form>
  );
}
