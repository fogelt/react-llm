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
          const isAssistant = m.role === 'assistant';

          // Logic: Hide the badge if the AI started typing, UNLESS there is an error
          const hasContent = m.content && m.content.trim().length > 0;
          const showToolBadge = isAssistant && m.usedTool && (!hasContent || m.isError);

          const hasAttachment = isUser && ((m.images && m.images.length > 0) || m.extraContext);

          // Common badge style
          const badgeBaseClass = "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tighter mb-2 w-fit px-2 py-0.5 rounded shadow-sm opacity-90 transition-all duration-300 animate-in zoom-in fade-in";

          return (
            <div key={i} className="flex flex-col gap-2 mb-4">
              <div
                className={`
                  glass inline-block max-w-[65%] py-[0.6rem] px-[0.9rem] leading-[1.3] break-words whitespace-pre-wrap overflow-x-auto transition-all duration-500
                  ${isUser ? 'self-end rounded-br rounded-tl-lg' : 'self-start rounded-bl rounded-tr-lg'}
                  
                  /* Dynamic Border Logic */
                  ${m.isError
                    ? 'border border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : showToolBadge
                      ? 'border-l-2 border-emerald-400/50 opacity-75 scale-[0.98]'
                      : 'border-none'
                  }
                  
                  ${hasAttachment ? 'border-r-2 border-emerald-400/50 text-right' : ''}
                `}
              >
                {/* FLOATING STATUS BADGE */}
                {showToolBadge && (
                  <div className={`
                      ${badgeBaseClass} 
                      ${m.isError
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }
                  `}>
                    <span className="material-icons !text-[12px] animate-pulse">
                      {m.isError ? 'error_outline' : (m.toolStatus === 'thinking' ? 'hourglass_empty' : 'build')}
                    </span>
                    <span className="capitalize">
                      {m.isError ? (m.toolName || 'System Error') : (m.toolStatus === 'thinking' ? 'Thinking...' : m.toolName)}
                    </span>
                  </div>
                )}

                {/* ATTACHMENT BADGE (User) */}
                {hasAttachment && (
                  <div className={`${badgeBaseClass} bg-emerald-500/10 text-emerald-300 ml-auto`}>
                    <span className="material-icons !text-[12px] animate-pulse">attach_file</span>
                    Attachment
                  </div>
                )}

                {/* IMAGE PREVIEW */}
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
                  {hasContent ? (
                    <div className={m.isError ? "text-red-200/80" : ""}>
                      <ChatMessage content={m.content} />
                    </div>
                  ) : isAssistant && !m.isError ? (
                    <div className="flex gap-1 py-1 opacity-100">
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-white rounded-full animate-bounce"></span>
                    </div>
                  ) : m.isError && !hasContent ? (
                    <p className="text-[11px] text-red-400 italic">The operation could not be completed.</p>
                  ) : null}
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