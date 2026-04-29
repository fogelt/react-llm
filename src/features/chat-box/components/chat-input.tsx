import { ChangeEvent, FormEvent, useEffect, useRef } from "react";
import { CircleButton } from "@/components/ui";
import { TextInput } from "@/components/ui";
import { useWhisper } from "@/hooks";

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  onUpload?: (file: File) => void;
  hasAttachment: boolean;
  onRemoveAttachment?: () => void;
};

export function ChatInput({ value, onChange, onSend, onStop, isLoading = false, onUpload, hasAttachment, onRemoveAttachment }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const latestValue = useRef(value);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  const { isRecording, toggleRecording } = useWhisper((transcript) => {
    const currentValue = latestValue.current;
    if (currentValue.endsWith(transcript)) return;
    const separator = currentValue.length > 0 && !currentValue.endsWith(" ") ? " " : "";
    const newValue = currentValue + separator + transcript;

    onChange({
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>);
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) {
      onStop?.();
    } else if (value.trim() || hasAttachment) {
      onSend();
    }
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

      <TextInput
        value={value}
        onChange={onChange}
        placeholder={hasAttachment ? "Add context or hit Send..." : "Type your message..."}
        disabled={isLoading}
        className={'pr-[5.8rem] pl-[3.6rem] h-30 resize-none overflow-y-auto'}
        aria-label="Message"
      />

      <CircleButton
        type="button"
        onClick={handleLeftButtonClick}
        aria-label={hasAttachment ? "Remove attached file" : "Upload file"}
        title={hasAttachment ? "Remove attached file" : "Upload file"}
        isDestructive={hasAttachment}
        className="left-[10px]"
      >
        {hasAttachment ? (
          <span className="material-icons !text-[16px]" aria-hidden>close</span>
        ) : (
          <span className="material-icons !text-[16px]" aria-hidden>add</span>
        )}
      </CircleButton>
      <CircleButton className="right-[50px]" onClick={toggleRecording}>
        {isRecording ? (
          <span className="material-icons !text-[18px] translate-x-px text-red-500 animate-pulse" aria-hidden>mic_off</span>
        ) : (
          <span className="material-icons !text-[18px] translate-x-px" aria-hidden>mic</span>
        )}
      </CircleButton>
      <CircleButton
        type="submit"
        aria-label={isLoading ? "Stop generating" : "Send message"}
        disabled={!isLoading && !value.trim() && !hasAttachment}
        className="right-[10px]"
        isDestructive={isLoading}
      >
        {isLoading ? (
          <span className="material-icons !text-[22px] -translate-x-[-1px]" aria-hidden>stop</span>
        ) : (
          <span className="material-icons !text-[16px] -translate-x-[-1px] -translate-y-[0.5px]" aria-hidden>send</span>
        )}
      </CircleButton>
    </form>
  );
}