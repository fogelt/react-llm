import { Message } from "../types";

type MessageListProps = {
  messages: Message[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="message-list glass">
      {messages.length === 0 ? (
        <p className="empty-message">No messages yet. Start a conversation!</p>
      ) : (
        messages.map((m, i) => (
          <div key={i} className="message-turn">
            <div
              className={`bubble glass ${m.role === 'user'
                ? 'self-end rounded-br'
                : 'self-start rounded-bl'
                }`}
            >
              <div className="bubble-text">{m.content}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}