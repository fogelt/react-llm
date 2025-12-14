import { useState } from "react";
import { ChatBox } from "@/components/chat-box/chat-box";
import { Menu } from '@/components/side-menu/side-menu';
import { Message } from "../../types/types";

function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [saveTrigger, setSaveTrigger] = useState(0);

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
      />
      <ChatBox messages={messages}
        setMessages={setMessages}
        onChatSaved={handleChatSaved} />
    </div>
  );
}

export default ChatLayout;