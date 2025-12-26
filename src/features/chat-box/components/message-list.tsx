import { Message } from "@/types";
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
        <p className="text-[11px] font-bold text-slate-300/50 mb-1.5 ml-1 uppercase tracking-widest">
          No messages yet. Start a conversation!
        </p>
      ) : (
        messages.map((m, i) => {
          const isUser = m.role === 'user';
          const usedTool = !isUser && m.usedTool;
          const hasAttachment = isUser && ((m.images && m.images.length > 0) || m.extraContext);

          // Gemensam badge-stil
          const badgeBaseClass = "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter mb-2 w-fit px-2 py-0.5 rounded shadow-sm opacity-90";

          return (
            <div key={i} className="flex flex-col gap-2 mb-4">
              <div
                className={`
                  glass inline-block max-w-[65%] py-[0.6rem] px-[0.9rem] leading-[1.3] break-words whitespace-pre-wrap overflow-x-auto
                  ${isUser ? 'self-end rounded-br rounded-tl-lg' : 'self-start rounded-bl rounded-tr-lg'}
                  ${usedTool ? 'border-l-2 border-emerald-400/50' : ''}
                  ${hasAttachment ? 'border-r-2 border-emerald-400/50 text-right' : ''}
                `}
              >
                {/* TOOL BADGE (Assistant) */}
                {usedTool && (
                  <div className={`${badgeBaseClass} bg-emerald-500/10 text-emerald-300`}>
                    <span className="material-icons !text-[12px] animate-pulse">build</span>
                    Function called
                  </div>
                )}

                {/* ATTACHMENT BADGE (User) */}
                {hasAttachment && (
                  <div className={`${badgeBaseClass} bg-emerald-500/10 text-emerald-300 ml-auto`}>
                    <span className="material-icons !text-[12px]">attach_file</span>
                    Attachment
                  </div>
                )}

                {m.images && m.images.length > 0 && isUser && (
                  <div className="my-2 border border-white/10 rounded-md overflow-hidden shadow-lg">
                    <img
                      src={m.images[0]}
                      alt="Attached preview"
                      className="max-w-full h-auto object-cover max-h-[180px]"
                    />
                  </div>
                )}

                <div className={hasAttachment ? "text-left" : ""}>
                  <ChatMessage content={m.content} />
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}