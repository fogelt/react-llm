import { useEffect, useState } from "react";
import { Message } from "../types";
import { loadChat } from "../services/chatSerializer";

interface MenuProps {
  onLoadChat: (messages: Message[]) => void;
}

export function Menu({ onLoadChat }: MenuProps) {
  const [savedChats, setSavedChats] = useState<string[]>([]);

  // Load all chat IDs from localStorage
  useEffect(() => {
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith("chat-"))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1])); // optional: newest first
    setSavedChats(keys);
  }, []);

  const handleLoadChat = (chatId: string) => {
    const messages = loadChat(chatId);
    if (messages) onLoadChat(messages); // this updates the ChatBox via App
  };

  return (
    <div className="side-menu glass">
      <p className="font-bold mb-2">Saved Chats</p>
      <div className="flex flex-col gap-2 h-[30vh] w-full glass overflow-y-auto p-2">
        {savedChats.length === 0 && <div className="text-gray-500">No saved chats</div>}
        {savedChats.map((chatId) => (
          <button
            key={chatId}
            className="btn saved-chat-button"
            onClick={() => handleLoadChat(chatId)}
          >
            {chatId}
          </button>
        ))}
      </div>
    </div>
  );
}
