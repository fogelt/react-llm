import { ChangeEvent, Dispatch, SetStateAction, useState, useRef, useEffect, useCallback } from "react";
import { Message } from "../types";
import { streamChatMessage } from "../services/chatService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { saveChat } from "../utils/chatSerializer";

interface ChatBoxProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  onChatSaved: () => void;
}

export function ChatBox({ messages, setMessages, onChatSaved }: ChatBoxProps) {
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- HELPER: Centralized Streaming Logic (Handles state updates and AI call) ---
  const handleStreamResponse = useCallback(async (userMessage: Message) => {
    const assistantPlaceholder: Message = { role: "assistant", content: "" };

    // Add user message and assistant placeholder to chat history
    setMessages((prev) => {
      const updated = [...prev, userMessage, assistantPlaceholder];
      saveChat(updated);
      onChatSaved();
      return updated;
    });

    setIsLoading(true);
    let assistantResponse = '';
    const messagesForStream = [...messages, userMessage, assistantPlaceholder];

    await streamChatMessage(messagesForStream, (chunk) => {
      assistantResponse += chunk;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: assistantResponse
        };
        saveChat(updated);
        onChatSaved();
        return updated;
      });
    });
    setIsLoading(false);

  }, [messages, setMessages, onChatSaved]); // Dependencies

  const handleFileSelect = (file: File) => {
    setFileToUpload(file);
  };
  const handleRemoveAttachment = () => {
    setFileToUpload(null);
  };

  const handleSubmit = async () => {
    const inputContent = input.trim();
    if (!inputContent && !fileToUpload) return;

    setIsLoading(true);

    let userMessageContent = inputContent;
    let userMessage: Message;

    try {
      // Check if a file is staged for upload
      if (fileToUpload) {
        const form = new FormData();
        form.append("file", fileToUpload);

        const res = await fetch("http://localhost:8081/api/upload", {
          method: "POST",
          body: form,
        });

        if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);

        const data = await res.json();

        let extraContext = "";
        let images: string[] = [];

        if (data.type === "pdf") {
          const docName = data.name || fileToUpload.name;
          extraContext = `Uploaded PDF: ${docName}\n\nDocument content:\n${data.text || ""}`;

        } else if (data.type === "image") {
          images = [data.base64];

        } else {
          alert("File type not supported by the upload server.");
          throw new Error("Unsupported file type returned by server.");
        }

        // Construct final user message with combined data
        userMessage = {
          role: "user",
          content: userMessageContent,
          extraContext: extraContext,
          images: images.length > 0 ? images : undefined,
        };
      } else {
        userMessage = { role: "user", content: inputContent };
      }

      setInput("");
      setFileToUpload(null);

      await handleStreamResponse(userMessage);

    } catch (error) {
      console.error("Submission failed:", error);
      alert(`Submission failed. Make sure the upload server is running.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-box">
      <MessageList
        messages={messages}
        bottomRef={bottomRef}
      />
      <ChatInput
        value={input}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSubmit}
        isLoading={isLoading}
        onUpload={handleFileSelect}
        hasAttachment={!!fileToUpload}
        onRemoveAttachment={handleRemoveAttachment}
      />
    </div>
  );
}