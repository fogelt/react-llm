import { RectButton } from "@/components/ui";
import { ModelLoader } from "./api/model-loader"
import { Message } from "@/types";
import { ChatHistoryList } from "@/features/chat-history/chat-history";

interface MenuProps {
  onLoadChat: (messages: Message[]) => void;
  onClearChat: () => void;
  saveTrigger: number;
}

export function Menu({ onLoadChat, onClearChat, saveTrigger }: MenuProps) {
  return (
    <div className="glass p-4 w-[20vw] h-[80vh] flex flex-col">
      <div className="glass p-2 mt-2 mb-2">
        <RectButton
          onClick={onClearChat}
        >
          Ny chatt
        </RectButton>
      </div>
      <ChatHistoryList
        onLoadChat={onLoadChat}
        saveTrigger={saveTrigger}
      />

      <ModelLoader />
    </div>
  );
}