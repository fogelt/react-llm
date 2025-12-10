import { Message } from "../types";
import { RefObject } from "react"; // Import RefObject type
import ReactMarkdown from 'react-markdown';

type MessageListProps = {
  messages: Message[];
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function MessageList({ messages, bottomRef }: MessageListProps) {
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
              <div className="bubble-text">
                <ReactMarkdown>
                  {m.content}
                </ReactMarkdown>
              </div>

            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
