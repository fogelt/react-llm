import { ChangeEvent, Dispatch, SetStateAction, useState, useRef, useEffect, useCallback } from "react";
import { Message } from "@/types";
import { streamChatMessage, type ChatMetrics } from "./api/chat-service";
import { uploadFile } from "./api/upload-service";
import { MessageList } from "./components/message-list";
import { ChatInput } from "./components/chat-input";
import { saveChat } from "./utils/chat-serializer"
import { generateUID } from "@/utils";
import { InfoLabel, ContextBar } from "@/components/ui";

interface ChatBoxProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  onChatSaved: () => void;
  contextLimit: number;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export function ChatBox({ messages, setMessages, onChatSaved, contextLimit, isLoading, setIsLoading }: ChatBoxProps) {
  const [input, setInput] = useState<string>("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleStreamResponse = useCallback(async (userMessage: Message) => {
    const assistantPlaceholder: Message = { role: "assistant", content: "" };

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let chatId: string | undefined = undefined;
    if (messages.length === 0) {
      chatId = generateUID();
    }
    // Add user message and assistant placeholder to chat history
    setMessages((prev) => {
      const updated = [...prev, userMessage, assistantPlaceholder];
      saveChat(updated, chatId);
      onChatSaved();
      return updated;
    });


    setIsLoading(true);
    let assistantResponse = '';
    const messagesForStream = [...messages, userMessage, assistantPlaceholder];

    try {
      await streamChatMessage(
        messagesForStream,
        (chunk) => {
          assistantResponse += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantResponse };
            saveChat(updated, chatId);
            onChatSaved();
            return updated;
          });
        },
        (newMetrics: ChatMetrics) => {
          setMetrics((prev) => ({
            ...newMetrics,
            totalTokens: newMetrics.totalTokens > 0 ? newMetrics.totalTokens : (prev?.totalTokens || 0) + 1
          }))
        },
        controller.signal
      );
    } catch (error: any) {
      if (error.name === 'AbortError') console.log("Stream stopped by user");
      else console.error("Stream error:", error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, setMessages, onChatSaved, contextLimit, metrics, setIsLoading]);

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
        const data = await uploadFile(fileToUpload);

        let extraContext = "";
        let images: string[] = [];

        if (data.type === "pdf") {
          const docName = data.name || fileToUpload.name;
          extraContext = `Uploaded PDF: ${docName}\n\nDocument content:\n${data.text || ""}`;

        } else if (data.type === "image") {
          images = [data.base64];

        } else {
          alert("File type not supported by the upload server.");
          // The uploadFile service throws a specific error, but we throw again for safety
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
      // Use the error message thrown by the service
      alert(`Submission failed: ${(error as Error).message}`);
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
        onStop={handleStop}
        isLoading={isLoading}
        onUpload={handleFileSelect}
        hasAttachment={!!fileToUpload}
        onRemoveAttachment={handleRemoveAttachment}
      />
      <div className="mt-2 flex items-center gap-2">
        <InfoLabel isActive={isLoading} isLoading={isLoading}>
          {isLoading ? 'Working' : 'Ready'}
        </InfoLabel>
        <ContextBar
          current={metrics?.totalTokens || 0}
          limit={contextLimit}
        />
        <InfoLabel>
          <span className="text-slate-300 text-[10px] uppercase mr-1">
            TPS
          </span>
          <span className="text-emerald-300">
            {metrics?.tokensPerSecond?.toFixed(2) ?? '0.00'}
          </span>
        </InfoLabel>
      </div>
    </div>
  );
}