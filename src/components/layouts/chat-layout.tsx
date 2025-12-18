import { useState } from "react";
import { ChatBox } from "@/features/chat-box/chat-box";
import { Menu } from '@/features/side-menu/side-menu';
import { Message } from "@/types";
import { ChatData } from "@/features/chat-box/utils/chat-serializer";

function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contextUsage, setContextUsage] = useState(0);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [contextSize, setContextSize] = useState("1024");
  const [isLoading, setIsLoading] = useState(false);

  const handleClearChat = () => {
    setMessages([]);
    setContextUsage(0);
  };

  const handleChatSaved = () => {
    setSaveTrigger(prev => prev + 1);
  }

  const handleLoadChat = (chatData: ChatData) => {
    setMessages(chatData.messages);
    setContextUsage(chatData.contextUsage || 0);
  };

  return (
    <div className="min-h-screen flex p-8 px-4 gap-[2.5vw]">
      <Menu
        onLoadChat={handleLoadChat}
        onClearChat={handleClearChat}
        saveTrigger={saveTrigger}
        contextSize={contextSize}
        setContextSize={setContextSize}
        isLoading={isLoading}
      />
      <ChatBox messages={messages}
        setMessages={setMessages}
        onChatSaved={handleChatSaved}
        contextUsage={contextUsage}
        setContextUsage={setContextUsage}
        contextLimit={parseInt(contextSize) || 1024}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </div>
  );
}

export default ChatLayout;