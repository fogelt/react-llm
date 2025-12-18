import { useState } from "react";
import { ChatBox } from "@/features/chat-box/chat-box";
import { Menu } from '@/features/side-menu/side-menu';
import { Message } from "../../types/types";

function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [contextSize, setContextSize] = useState("1024");
  const [isLoading, setIsLoading] = useState(false);

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleChatSaved = () => {
    // Incrementing the number guarantees a state change, forcing Menu's useEffect to run.
    setSaveTrigger(prev => prev + 1);
  }

  const handleLoadChat = (loadedMessages: Message[]) => {
    setMessages(loadedMessages);
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
        contextLimit={parseInt(contextSize) || 1024}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </div>
  );
}

export default ChatLayout;