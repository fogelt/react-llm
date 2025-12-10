import { ChangeEvent, Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { streamChatMessage } from "../services/chatService";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { saveChat } from "../services/chatSerializer";

interface ChatBoxProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
}

export function ChatBox({ messages, setMessages }: ChatBoxProps) {
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const assistantMessage: Message = { role: "assistant", content: "" };

    setInput(""); //Clear input
    setMessages((prev) => {
      const updated = [...prev, userMessage, assistantMessage];
      saveChat(updated);
      return updated;
    });

    setIsLoading(true);

    let assistantResponse = "";

    await streamChatMessage([...messages, userMessage, assistantMessage], (chunk) => {
      assistantResponse += chunk;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantResponse };
        saveChat(updated);
        return updated;
      });
    });

    setIsLoading(false);
  };

  const handleUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);

    try {
      setIsLoading(true);

      const res = await fetch("http://localhost:8081/api/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);

      const data = await res.json();

      let assistantMessage = "";

      let userMessage: Message;
      if (data.type === "pdf") {
        const docName = data.name || file.name;
        const docText = data.text || "";

        userMessage = {
          role: "user",
          content: "Uploaded a PDF",
          extraContext: `Uploaded ${docName}\n\nDocument content:\n${docText}`,
        };
      } else if (data.type === "image") {
        const imgBase64 = data.base64;
        userMessage = {
          role: "user",
          content: "Here's an uploaded image for you to check:",
          images: [imgBase64],
        };
      } else return;

      const assistantPlaceholder: Message = { role: "assistant", content: "" };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

      const messagesForStream = [...messages, userMessage, assistantPlaceholder];

      await streamChatMessage(messagesForStream, (chunk) => {
        assistantMessage += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantMessage };
          saveChat(updated);
          return updated;
        });
      });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("File upload failed. Make sure the upload server is running at http://localhost:8081");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-box">
      <MessageList messages={messages} bottomRef={bottomRef} />
      <ChatInput
        value={input}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        onSend={handleSendMessage}
        isLoading={isLoading}
        onUpload={handleUpload}
      />
    </div>
  );
}
