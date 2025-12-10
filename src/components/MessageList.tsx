import { Message } from "../types";
import { RefObject } from "react"; // Import RefObject type
import ReactMarkdown from 'react-markdown';

type MessageListProps = {
  messages: Message[];
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function MessageList({ messages, bottomRef }: MessageListProps) {
  return (
    <div className="glass mb-4 overflow-y-auto p-4 rounded-lg w-[75vw] h-[80vh]">
      {messages.length === 0 ? (
        <p className="empty-message">No messages yet. Start a conversation!</p>
      ) : (
        messages.map((m, i) => (
          <div key={i} className="flex flex-col gap-2 mb-4">
            <div
              className={`glass inline-block max-w-[65%] py-[0.6rem] px-[0.9rem] leading-[1.3] break-words whitespace-pre-wrap overflow-x-auto" ${m.role === 'user'
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
