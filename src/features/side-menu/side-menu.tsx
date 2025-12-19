import { RectButton } from "@/components/ui";
import { ModelLoader } from "./components/model-loader"
import { ChatHistoryList } from "@/features/side-menu/components/chat-history";
import { ChatData } from "@/features/chat-box/utils/chat-serializer";

interface MenuProps {
  onLoadChat: (chatData: ChatData, id: string) => void;
  onClearChat: () => void;
  saveTrigger: number;
  contextSize: string;
  setContextSize: (val: string) => void;
  isLoading: boolean;
}

export function Menu({ onLoadChat, onClearChat, saveTrigger, contextSize, setContextSize, isLoading }: MenuProps) {
  return (
    <div className="glass p-4 w-[20vw] h-[90vh] flex flex-col">
      <div className="glass p-2 mt-2 mb-2">
        <RectButton
          onClick={onClearChat}
          isDisabled={isLoading}
        >
          New chat
        </RectButton>
      </div>
      <ChatHistoryList
        onLoadChat={onLoadChat}
        saveTrigger={saveTrigger}
        isLoading={isLoading}
      />
      <ModelLoader
        contextSize={contextSize}
        setContextSize={setContextSize}
      />
    </div>
  );
}