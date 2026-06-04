"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square, SquarePen } from "lucide-react";
import { MessageContent } from "@/components/chat/message-content";
import { ThemeToggle } from "@/components/theme-toggle";

const LABELS = {
  heading: "What can I help you with?",
  subheading: "Ask anything — code, writing, analysis, or just a conversation.",
  you: "You",
  assistant: "Sourcive",
  placeholder: "Message… (Enter to send, Shift+Enter for new line)",
} as const;

const SUGGESTED_PROMPTS = [
  "Explain how streaming works in Next.js",
  "Write a Python quicksort with comments",
  "What is RAG in AI applications?",
  "Compare REST vs GraphQL",
] as const;

export default function ChatPage() {
  const { messages, input, isLoading, error, usage, handleInputChange, handleSubmit, setInput, clearMessages, stop } =
    useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  function onSuggest(prompt: string) {
    setInput(prompt);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-6 py-3 shrink-0 flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">Sourcive</h1>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="cursor-pointer" aria-label="New chat">
              <SquarePen className="h-4 w-4" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-6 pt-20 text-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {LABELS.heading}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {LABELS.subheading}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onSuggest(prompt)}
                    className="rounded-full border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className="space-y-1">
              <p className={`text-xs font-medium text-muted-foreground ${msg.role === "user" ? "text-right" : ""}`}>
                {msg.role === "user" ? LABELS.you : LABELS.assistant}
              </p>

              <div className={msg.role === "user" ? "flex justify-end" : "flex items-start gap-3"}>
                {/* Assistant avatar */}
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-400 text-xs font-bold text-white select-none">
                    S
                  </div>
                )}

                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                      : "min-w-0 flex-1 text-sm text-foreground"
                  }
                >
                  <MessageContent
                    content={msg.content}
                    role={msg.role}
                    showCursor={isLoading && i === messages.length - 1 && msg.role === "assistant"}
                  />
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-t bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Token / cost indicator */}
      {usage && (
        <div className="px-4 pb-1 text-center text-xs text-muted-foreground">
          {usage.totalTokens.toLocaleString()} tokens
          {usage.estimatedCost !== undefined && (
            <> · ~${usage.estimatedCost < 0.001 ? "<0.001" : usage.estimatedCost.toFixed(4)}</>
          )}
        </div>
      )}

      {/* Input bar — unified container */}
      <div className="px-4 py-4 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl rounded-2xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder={LABELS.placeholder}
            disabled={isLoading}
            rows={1}
            className="min-h-[48px] max-h-[200px] resize-none overflow-hidden border-0 bg-transparent px-4 pt-3 pb-1 shadow-none focus-visible:ring-0"
            autoFocus
          />
          {isLoading && (
            <div className="flex justify-end px-2 pb-2">
              <Button type="button" variant="ghost" size="icon" onClick={stop} className="h-8 w-8 cursor-pointer">
                <Square className="h-4 w-4" />
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
