import { ChangeEvent, Dispatch, SetStateAction, useState, useRef, useEffect, useCallback } from "react";
import { Message } from "@/types";
import { streamChatMessage, type ChatMetrics } from "./api/chat-service";
import { uploadFile } from "./api/upload-service";
import { MessageList } from "./components/message-list";
import { ChatInput } from "./components/chat-input";
import { saveChat } from "./utils/chat-serializer"
import { generateUID } from "@/utils";
import { InfoLabel, ProgressBar } from "@/components/ui";
import { useError } from "@/errors/error-context";

interface ChatBoxProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  onChatSaved: () => void;
  contextLimit: number;
  contextUsage: number;
  setContextUsage: (val: number) => void;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  activeChatId: string | undefined;
}

export function ChatBox({ messages, setMessages, onChatSaved, contextLimit, isLoading, setIsLoading, contextUsage, setContextUsage, activeChatId }: ChatBoxProps) {
  const { showError } = useError();
  const [input, setInput] = useState<string>("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [metrics, setMetrics] = useState<ChatMetrics | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isLoading]); //Scroll down when Loading changes gives us scroll both on start and end :)

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

    setMetrics(null);
    let chatId = activeChatId;
    if (!chatId && messages.length === 0) {
      chatId = generateUID();
    }
    // Add user message and assistant placeholder to chat history
    setMessages((prev) => {
      const updated = [...prev, userMessage, assistantPlaceholder];
      saveChat(updated, contextUsage, chatId);
      onChatSaved();
      return updated;
    });

    setIsLoading(true);
    let assistantResponse = '';
    const messagesForStream = [...messages, userMessage];

    try {
      await streamChatMessage(
        messagesForStream,
        (chunk) => {
          assistantResponse += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantResponse };
            saveChat(updated, contextUsage, chatId);
            onChatSaved();
            return updated;
          });
        },
        (newMetrics: ChatMetrics) => {
          setMetrics((prev) => {
            const baseValue = prev ? prev.totalTokens : contextUsage;
            return {
              ...newMetrics,
              totalTokens: newMetrics.totalTokens > 0
                ? newMetrics.totalTokens
                : baseValue + 1
            };
          });

          if (newMetrics.totalTokens > 0) {
            setContextUsage(newMetrics.totalTokens);
            setMessages((currentMessages) => {
              saveChat(currentMessages, newMetrics.totalTokens, chatId);
              return currentMessages;
            });
          }
        },
        controller.signal,
        (name: string, status?: string) => {
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                ...updated[lastIndex],
                usedTool: true,
                toolName: name,
                toolStatus: status,
                isError: name.toLowerCase().includes("error") || status === 'error'
              };
            }
            return updated;
          });
        },
        (newSources: any[]) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex < 0) return prev;
            const currentSources = updated[lastIndex].sources || [];
            const uniqueNew = newSources.filter(
              ns => !currentSources.some(cs => cs.url === ns.url)
            );
            if (uniqueNew.length > 0) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                sources: [...currentSources, ...uniqueNew]
              };
              saveChat(updated, contextUsage, chatId);
            }
            return updated;
          });
        }
      );
    } catch (error: any) {
      if (error.name === 'AbortError') console.log("Stream stopped by user");
      else showError(`${error}`);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
    // Added showError, contextUsage, and setContextUsage to dependencies
  }, [messages, setMessages, onChatSaved, contextLimit, setIsLoading, showError, contextUsage, setContextUsage]);

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
          showError("File type not supported by the upload server.");
          throw new Error("Unsupported file type returned by server.");
        }
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
      showError(`${(error as Error).message}`);
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
        <ProgressBar
          // If we have live metrics > 0, use those. Otherwise, stay with the last known contextUsage.
          current={(isLoading && metrics?.totalTokens) ? metrics.totalTokens : contextUsage}
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