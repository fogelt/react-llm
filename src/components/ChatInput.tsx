import { ChangeEvent, FormEvent, useRef } from "react";

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  isLoading?: boolean;
  onUpload?: (file: File) => void;
  hasAttachment: boolean;
  onRemoveAttachment?: () => void;
};

export function ChatInput({ value, onChange, onSend, isLoading = false, onUpload, hasAttachment, onRemoveAttachment }: ChatInputProps) {
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

  const handleLeftButtonClick = () => {
    if (isLoading) return;

    if (hasAttachment && onRemoveAttachment) {
      // If there's an attachment, the button removes it
      onRemoveAttachment();
    } else {
      // Otherwise, the button opens the file dialog
      handleUploadClick();
    }
  };

  return (
    <form className="flex relative items-center" onSubmit={handleSubmit}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        aria-hidden
        accept="image/*, application/pdf"
      />

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={hasAttachment ? "Add context or hit Send..." : "Type your message..."}
        disabled={isLoading}
        className={'glass w-full rounded-[20px] text-base font-sans py-[0.6rem] pr-[3.8rem] pl-[3.6rem] pl-4'}
        aria-label="Message"
        autoComplete="off"
      />

      <button
        type="button"
        className={hasAttachment ? "btn danger circle-button glass left-[10px]" : "btn circle-button glass left-[10px]"}
        onClick={handleLeftButtonClick}
        aria-label={hasAttachment ? "Remove attached file" : "Upload file"}
        title={hasAttachment ? "Remove attached file" : "Upload file"}
        disabled={isLoading}
      >
        {hasAttachment ? (
          <span className="material-icons !text-[16px]" aria-hidden>close</span>
        ) : (
          <span className="material-icons !text-[16px]" aria-hidden>add</span>
        )}
      </button>

      <button
        type="submit"
        aria-label="Send message"
        disabled={isLoading || (!value.trim() && !hasAttachment)}
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