import { useState } from "react";
import { ChatBox } from "./components/ChatBox";
import { Menu } from "./components/Menu";
import { Message } from "./types";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleClearChat = () => {
    // Set the state back to an empty array of Messages
    setMessages([]);
  };

  // Callback to load messages from Menu
  const handleLoadChat = (loadedMessages: Message[]) => {
    setMessages(loadedMessages);
  };

  return (
    <div className="App flex">
      <Menu
        onLoadChat={handleLoadChat}
        onClearChat={handleClearChat}
      />
      <ChatBox messages={messages} setMessages={setMessages} />
    </div>
  );
}

export default App;