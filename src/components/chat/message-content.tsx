"use client";

import { useState, useRef } from "react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Check, Code2, Copy } from "lucide-react";

interface Props {
  content: string;
  role: "user" | "assistant" | "system";
  showCursor?: boolean;
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  return new Promise((resolve) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    resolve();
  });
}

function CodeBlock({ language, children }: { language: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  function copy() {
    copyToClipboard(preRef.current?.textContent ?? "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] text-sm not-prose" data-code-block>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Code2 className="h-3.5 w-3.5" />
          <span className="capitalize">{language || "code"}</span>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre ref={preRef} className="overflow-x-auto p-4 m-0 bg-transparent">
        {children}
      </pre>
    </div>
  );
}

export function MessageContent({ content, role, showCursor }: Props) {
  if (role !== "assistant") {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-0 prose-code:before:content-none prose-code:after:content-none"
      data-streaming={showCursor ? "true" : undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            const codeEl = React.Children.toArray(children).find(
              (c): c is React.ReactElement =>
                React.isValidElement(c) && (c as React.ReactElement).type === "code",
            ) as React.ReactElement | undefined;
            const language = ((codeEl?.props?.className as string) ?? "")
              .replace("language-", "")
              .replace(" hljs", "")
              .trim();
            return <CodeBlock language={language}>{children}</CodeBlock>;
          },
          code({ className, children, ...props }) {
            // Block code (inside pre) — no extra styling
            const isBlock = className?.includes("language-") || className?.includes("hljs");
            if (isBlock) return <code className={className} {...props}>{children}</code>;
            // Inline code
            return (
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
