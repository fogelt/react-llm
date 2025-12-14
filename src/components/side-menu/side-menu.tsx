import { useEffect, useState } from "react";
import { Message } from "../../types/types";
import { loadChat } from "@/components/chat-box/features/chat-serializer";
import { ModelLoader } from "./features/model-loader"
import { RectButton } from "@/components/ui";
import { CircleButton } from "@/components/ui";

interface MenuProps {
  onLoadChat: (messages: Message[]) => void;
  onClearChat: () => void;
  saveTrigger: number;
}

export function Menu({ onLoadChat, onClearChat, saveTrigger }: MenuProps) {
  const [savedChats, setSavedChats] = useState<string[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage)
      .filter((key) => key.startsWith("chat-"))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    setSavedChats(keys);
  }, [saveTrigger]);

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
    <div className="glass p-4 w-[20vw] h-[80vh] flex flex-col">
      <div className="glass p-2 mt-2 mb-2">
        <RectButton
          onClick={onClearChat}
        >Ny chatt
        </RectButton>
      </div>
      <div className="flex flex-col gap-2 h-[30vh] w-full glass overflow-y-auto p-2">
        {savedChats.length === 0 && <div className="text-white-500">No saved chats</div>}
        {savedChats.map((chatId) => (
          <div className="glass p-2">
            {generateName(chatId)}
            <CircleButton
              type="button"
              onClick={() => handleLoadChat(chatId)}
              className="right-[43px]"
            >
              <span className="material-icons !text-[16px] -translate-x-[-1px] -translate-y-[0.5px]" aria-hidden>
                save
              </span>
            </CircleButton>
            <CircleButton
              type="button"
              onClick={() => handleRemoveChat(chatId)}
              isDestructive={true}
              className="right-[10px]"
            >
              <span className="material-icons !text-[16px] -translate-y-[0.5px]" aria-hidden>
                delete
              </span>
            </CircleButton>
          </div>
        ))}
      </div>
      <ModelLoader />
    </div>
  );
}
