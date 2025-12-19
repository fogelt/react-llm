import { useEffect, useState } from "react";
import { loadChat, ChatData } from "@/features/chat-box/utils/chat-serializer";
import { CircleButton } from "@/components/ui";

interface ChatHistoryListProps {
  onLoadChat: (chatData: ChatData, chatId: string) => void;
  saveTrigger: number;
  isLoading: boolean;
}

const generateName = (chatId: string): string => {
  const data = loadChat(chatId);
  const maxLength = 20;

  const rawContent = data?.messages?.find((m) => m.role === "user")?.content.trim() ?? 'Untitled Chat';

  let name = rawContent;
  if (name.length > maxLength) {
    name = name.substring(0, maxLength).trim() + "...";
  }
  return name;
};

export function ChatHistoryList({ onLoadChat, saveTrigger, isLoading }: ChatHistoryListProps) {
  const [savedChats, setSavedChats] = useState<string[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith("chat-"))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    setSavedChats(keys);
  }, [saveTrigger]);

  const handleLoadChat = (id: string) => {
    const chatData = loadChat(id);
    if (chatData) {
      onLoadChat(chatData, id);
    }
  };

  const handleRemoveChat = (chatId: string) => {
    localStorage.removeItem(chatId);
    setSavedChats((prevChats) => prevChats.filter((id) => id !== chatId));
  };

  return (
    <div className="flex flex-col gap-2 h-[30vh] w-full glass overflow-y-auto p-2">
      {savedChats.length === 0 && <div className="text-white-500">No saved chats</div>}

      {savedChats.map((chatId) => (
        <div key={chatId} className="glass p-2 relative">
          {generateName(chatId)}
          <CircleButton
            type="button"
            onClick={() => handleLoadChat(chatId)}
            className="right-[43px] absolute top-1/2 -translate-y-1/2"
            isDisabled={isLoading}
          >
            <span className="material-icons !text-[16px] -translate-y-[0.5px]" aria-hidden>
              save
            </span>
          </CircleButton>
          <CircleButton
            type="button"
            onClick={() => handleRemoveChat(chatId)}
            isDestructive={true}
            className="right-[10px] absolute top-1/2 -translate-y-1/2"
          >
            <span className="material-icons !text-[16px] -translate-y-[0.5px]" aria-hidden>
              close
            </span>
          </CircleButton>
        </div>
      ))}
    </div>
  );
}