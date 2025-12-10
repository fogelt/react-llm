import { useEffect, useState } from "react";
import { Message } from "../types";
import { loadChat } from "../utils/chatSerializer";

interface MenuProps {
  onLoadChat: (messages: Message[]) => void;
  onClearChat: () => void;
}

export function Menu({ onLoadChat, onClearChat }: MenuProps) {
  const [savedChats, setSavedChats] = useState<string[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith("chat-"))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    setSavedChats(keys);
  }, []);

  const handleLoadChat = (chatId: string) => {
    const messages = loadChat(chatId);
    if (messages) onLoadChat(messages); // this updates the ChatBox via App
  };

  const handleRemoveChat = (chatId: string) => {
    localStorage.removeItem(chatId);
    setSavedChats((prevChats) => prevChats.filter((id) => id !== chatId));
  };

  const generateName = (chatId: string): string => {
    const messages: Message[] | null = loadChat(chatId);
    const maxLength = 20;
    const rawContent = messages?.find((m) => m.role === "user")?.content.trim() ?? '';
    let name = rawContent;
    if (name.length > maxLength) {
      name = name.substring(0, maxLength).trim() + "...";
    }
    return name;
  };

  return (
    <div className="side-menu glass">
      <p className="font-bold mb-2">Saved Chats</p>
      <div className="flex flex-col gap-2 h-[30vh] w-full glass overflow-y-auto p-2">
        {savedChats.length === 0 && <div className="text-white-500">No saved chats</div>}
        {savedChats.map((chatId) => (
          <div className="glass p-2">
            {generateName(chatId)}
            <button
              key={chatId}
              className="btn circle-button glass right-[43px]"
              onClick={() => handleLoadChat(chatId)}
            >
              <span className="material-icons !text-[16px] -translate-x-[-1px] -translate-y-[0.5px]" aria-hidden>save</span>
            </button>
            <button
              key={chatId}
              className="btn danger circle-button glass right-[10px]"
              onClick={() => handleRemoveChat(chatId)}
            >
              <span className="material-icons !text-[16px] -translate-y-[0.5px]" aria-hidden>delete</span>
            </button>
          </div>
        ))}
      </div>
      <div className="glass p-2 m-4 font-bold mb-2">Ny chatt
        <button
          className="btn circle-button glass right-[10px]"
          onClick={onClearChat}
        >
          <span className="material-icons !text-[16px] -translate-y-[0.5px]" aria-hidden>add</span>
        </button>
      </div>

    </div>
  );
}
