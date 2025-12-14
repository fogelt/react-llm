import ReactMarkdown from 'react-markdown';
import React from 'react';

interface ChatMessageProps {
  content: string;
}

const PreRenderer: React.FC<React.PropsWithChildren<any>> = ({ children }) => (
  <pre
    className={`
      bg-[#171717] text-[#f8f8f2] border border-white rounded-md p-3 my-2 overflow-x-auto 
      font-mono text-[0.9em]
      [white-space:pre-wrap] [word-wrap:break-word]
    `}
  >
    {children}
  </pre>
);

const CodeRenderer: React.FC<React.PropsWithChildren<any>> = ({ children }) => (
  <code
    className={`
      bg-[rgba(0,0,0,0.5)] text-white px-1 py-[2px] rounded font-mono text-[0.95em] 
      [word-break:break-all]
    `}
  >
    {children}
  </code>
);

const CustomRenderers = {
  pre: PreRenderer,
  code: CodeRenderer,
};

function ChatMessage({ content }: ChatMessageProps) {
  return (
    <div className="bubble-text">
      <ReactMarkdown components={CustomRenderers}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export { ChatMessage }