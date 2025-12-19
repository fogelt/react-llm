import { Message } from "@/types/types";
import { RefObject } from "react";
import { ChatMessage } from "@/components/ui";

type MessageListProps = {
  messages: Message[];
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function MessageList({ messages, bottomRef }: MessageListProps) {
  return (
    <div className="glass mb-4 overflow-y-auto p-4 rounded-lg w-[75vw] h-[80vh]">
      {messages.length === 0 ? (
        <p className="text-[11px] font-bold text-slate-300/50 mb-1.5 ml-1 uppercase tracking-widest">No messages yet. Start a conversation!</p>
      ) : (
        messages.map((m, i) => {
          const isUser = m.role === 'user';
          const hasAttachmentInMessage = isUser && ((m.images && m.images.length > 0) || m.extraContext);
          const attachmentClasses = hasAttachmentInMessage
          return (
            <div key={i} className="flex flex-col gap-2 mb-4">
              <div
                className={`
                  glass inline-block max-w-[65%] py-[0.6rem] px-[0.9rem] leading-[1.3] break-words whitespace-pre-wrap overflow-x-auto
                  ${isUser ? 'self-end rounded-br' : 'self-start rounded-bl'}
                  ${isUser ? 'rounded-tl-lg' : 'rounded-tr-lg'}
                  ${attachmentClasses}
                `}
              >
                {hasAttachmentInMessage && (
                  <div className="text-xs mb-1 flex items-center gap-1">
                    <span className="material-icons !text-[14px]">attach_file</span>
                    Attachment
                  </div>
                )}

                {m.images && m.images.length > 0 && isUser && (
                  <div className="my-2 border border-gray-600 rounded-md overflow-hidden">
                    <img
                      src={m.images[0]}
                      alt="Attached image preview"
                      className="max-w-full h-auto object-cover max-h-[150px]"
                    />
                  </div>
                )}
                <ChatMessage content={m.content} />
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}