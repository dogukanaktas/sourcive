"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square } from "lucide-react";
import { MessageContent } from "@/components/chat/message-content";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ChatPage() {
  const { messages, input, isLoading, error, handleInputChange, handleSubmit, stop } =
    useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea as user types.
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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-3 shrink-0 flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">Sourcive</h1>
        <ThemeToggle />
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground pt-24">
              Bir şey sor…
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="space-y-1">
              {/* Role label */}
              <p className={`text-xs font-medium text-muted-foreground ${msg.role === "user" ? "text-right" : ""}`}>
                {msg.role === "user" ? "Sen" : "Sourcive"}
              </p>

              {/* Message body */}
              <div className={msg.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                      : "text-sm text-foreground"
                  }
                >
                  <MessageContent content={msg.content} role={msg.role} />
                  {isLoading &&
                    i === messages.length - 1 &&
                    msg.role === "assistant" && (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
                    )}
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

      {/* Input bar */}
      <div className="border-t px-4 py-4 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="Mesajını yaz… (Enter gönd, Shift+Enter yeni satır)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none overflow-hidden min-h-[40px] max-h-[200px]"
            autoFocus
          />
          {isLoading ? (
            <Button type="button" variant="outline" size="icon" onClick={stop} className="shrink-0">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
