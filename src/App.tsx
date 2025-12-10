import { useState } from "react";
import { ChatBox } from "./components/ChatBox";
import { Menu } from "./components/Menu";
import { Message } from "./types";

function App() {
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
    <div className="App flex">
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

export default App;