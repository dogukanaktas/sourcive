"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface Props {
  content: string;
  role: "user" | "assistant" | "system";
  showCursor?: boolean;
}

export function MessageContent({ content, role, showCursor }: Props) {
  if (role !== "assistant") {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none"
      data-streaming={showCursor ? "true" : undefined}
    >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre({ children, ...props }) {
          return (
            <pre className="overflow-x-auto rounded-lg p-4 text-sm" {...props}>
              {children}
            </pre>
          );
        },
        code({ className, children, ...props }) {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code className={className} {...props}>{children}</code>
          ) : (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
