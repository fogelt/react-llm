import { Message } from "../types";

type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <p className="empty-message">No messages yet. Start a conversation!</p>
      ) : (
        messages.map((m, i) => (
          <div key={i} className="message-turn">
            <div className={`bubble ${m.role === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              <div className="bubble-text">{m.content}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}