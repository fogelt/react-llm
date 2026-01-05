import { Message } from "@/types";
import { RefObject } from "react";
import { ChatMessage } from "@/components/ui";

type MessageListProps = {
  messages: Message[];
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function MessageList({ messages, bottomRef }: MessageListProps) {
  const getToolTheme = (name?: string) => {
    const n = name?.toLowerCase() || "";
    if (n.includes("reddit")) return {
      label: "Searching Reddit",
      icon: "https://www.google.com/s2/favicons?domain=reddit.com&sz=32",
      color: "bg-[#FF4500]/20 text-[#FF4500] border-[#FF4500]/40"
    };
    if (n.includes("wikipedia")) return {
      label: "Searching Wikipedia",
      icon: "https://www.google.com/s2/favicons?domain=wikipedia.org&sz=32",
      color: "bg-white/20 text-slate-100 border-white/30"
    };
    if (n.includes("web") || n.includes("search")) return {
      label: "Searching Web",
      icon: "https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    };
    return {
      label: n || "Thinking",
      icon: null,
      color: "bg-slate-500/20 text-slate-300 border-slate-500/30"
    };
  };

  const getThinkingText = (name?: string) => {
    if (name && name !== "Thinking...") return name;
    return "Thinking...";
  };

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
          const hasContent = m.content && m.content.trim().length > 0;

          // Tool badge shows only when no content is present yet
          const showToolBadge = isAssistant && m.usedTool && (!m.content || m.content.length === 0);

          const hasAttachment = isUser && ((m.images && m.images.length > 0) || m.extraContext);
          const theme = getToolTheme(m.toolName);

          const badgeBaseClass = "flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight mb-2 w-fit px-2 py-1 rounded shadow-sm opacity-90 transition-all duration-300 animate-in zoom-in fade-in";

          return (
            <div key={i} className="flex flex-col gap-2 mb-4">
              <div
                className={`
                  glass inline-block max-w-[65%] py-[0.6rem] px-[0.9rem] leading-[1.3] break-words whitespace-pre-wrap overflow-x-auto transition-all duration-500
                  ${isUser ? 'self-end rounded-br rounded-tl-lg' : 'self-start rounded-bl rounded-tr-lg'}
                  ${m.isError ? 'border border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-none'}
                `}
              >
                {/* STATUS BAR: TOOL BADGE & SOURCES */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {showToolBadge && (
                    <div className={`
                        ${badgeBaseClass} mb-0
                        ${m.isError ? 'bg-red-500/20 text-red-400 border border-red-500/40' : theme.color}
                      `}>
                      {!m.isError && theme.icon ? (
                        <img src={theme.icon} className="w-3 h-3 rounded-full" alt="icon" />
                      ) : (
                        <span className="material-icons !text-[12px] animate-pulse">
                          {m.isError ? 'error_outline' : 'psychology'}
                        </span>
                      )}
                      <span className="capitalize">
                        {m.isError ? (m.toolName || 'Error') : (m.toolStatus === 'thinking' ? getThinkingText(m.toolName) : theme.label)}
                      </span>
                    </div>
                  )}

                  {/* SOURCES SECTION - Persistent icons */}
                  {m.sources && m.sources.length > 0 && (
                    <div className={`flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-500 ${showToolBadge ? 'pl-2 border-l border-white/10' : ''}`}>
                      {m.sources.map((source, idx) => {
                        // Safety logic to prevent Invalid URL crashes
                        if (!source.url || source.url === "No URL") return null;

                        let hostname = "";
                        try {
                          const validUrl = source.url.startsWith('http') ? source.url : `https://${source.url}`;
                          hostname = new URL(validUrl).hostname;
                        } catch (e) {
                          return null;
                        }

                        return (
                          <a
                            key={idx}
                            href={source.url.startsWith('http') ? source.url : `https://${source.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={source.title}
                            className="transition-transform hover:scale-125 block h-3.5"
                          >
                            <img
                              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                              className="w-3.5 h-3.5 rounded-sm grayscale-[0.3] hover:grayscale-0 shadow-sm"
                              alt="source"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=duckduckgo.com";
                              }}
                            />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ATTACHMENT BADGE */}
                {hasAttachment && (
                  <div className={`${badgeBaseClass} bg-emerald-500/10 text-emerald-300 ml-auto`}>
                    <span className="material-icons !text-[12px] animate-pulse">attach_file</span>
                    Attachment
                  </div>
                )}

                {/* IMAGE PREVIEW */}
                {m.images && m.images.length > 0 && isUser && (
                  <div className="my-2 border border-white/10 rounded-md overflow-hidden shadow-lg">
                    <img src={m.images[0]} alt="Attached preview" className="max-w-full h-auto object-cover max-h-[180px]" />
                  </div>
                )}

                {/* MESSAGE CONTENT */}
                <div>
                  {hasContent ? (
                    <div className={m.isError ? "text-red-200/80" : ""}>
                      <ChatMessage content={m.content} />
                    </div>
                  ) : isAssistant && !m.isError ? (
                    <div className="flex gap-1 py-1">
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