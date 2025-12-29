import ReactMarkdown from 'react-markdown';
import React from 'react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Required for math symbols to render

interface ChatMessageProps {
  content: string;
}

const PreRenderer: React.FC<React.PropsWithChildren<any>> = ({ children }) => (
  <pre
    className={`
      bg-[rgba(0,0,0,0.5)] text-white border border-white rounded-md p-3 my-2 overflow-x-auto 
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
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={CustomRenderers}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export { ChatMessage };