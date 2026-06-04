"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square } from "lucide-react";
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
  const { messages, input, isLoading, error, usage, isContextLong, handleInputChange, handleSubmit, setInput, clearMessages, stop } =
    useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEmpty = messages.length === 0;

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

  const inputBar = (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring"
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
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-6 py-3 shrink-0 flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">Sourcive</h1>
        <ThemeToggle />
      </header>

      {isEmpty ? (
        /* ── Landing layout: hero + input vertically centered ── */
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-tight">{LABELS.heading}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{LABELS.subheading}</p>
            </div>

            {inputBar}

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
        </div>
      ) : (
        /* ── Chat layout: scrollable messages + pinned input ── */
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className="space-y-1">
                  <p className={`text-xs font-medium text-muted-foreground ${msg.role === "user" ? "text-right" : ""}`}>
                    {msg.role === "user" ? LABELS.you : LABELS.assistant}
                  </p>
                  <div className={msg.role === "user" ? "flex justify-end" : "flex items-start gap-3"}>
                    {msg.role === "assistant" && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-400 text-xs font-bold text-white select-none">
                        S
                      </div>
                    )}
                    <div className={
                      msg.role === "user"
                        ? "max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                        : "min-w-0 flex-1 text-sm text-foreground"
                    }>
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

          {error && (
            <div className="border-t bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {isContextLong && (
            <div className="border-t bg-yellow-500/10 px-4 py-2 text-center text-xs text-yellow-600 dark:text-yellow-400">
              Conversation is getting long — consider{" "}
              <button onClick={clearMessages} className="underline underline-offset-2 cursor-pointer">
                starting a new chat
              </button>
            </div>
          )}

          {usage && (
            <div className="px-4 pb-1 text-center text-xs text-muted-foreground">
              {usage.totalTokens.toLocaleString()} tokens
              {usage.estimatedCost !== undefined && (
                <> · ~${usage.estimatedCost < 0.001 ? "<0.001" : usage.estimatedCost.toFixed(4)}</>
              )}
            </div>
          )}

          <div className="px-4 py-4 shrink-0">
            <div className="mx-auto max-w-3xl">
              {inputBar}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
