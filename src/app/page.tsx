"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square } from "lucide-react";

export default function ChatPage() {
  const { messages, input, isLoading, handleInputChange, handleSubmit, stop } =
    useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change (new message or delta arrives).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Sourcive</h1>
      </header>

      {/* Message list */}
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              Bir şey sor…
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
                {/* Blinking cursor while the last assistant message is streaming */}
                {isLoading &&
                  i === messages.length - 1 &&
                  msg.role === "assistant" && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
                  )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="border-t px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Mesajını yaz…"
            disabled={isLoading}
            className="flex-1"
            autoFocus
          />
          {isLoading ? (
            <Button type="button" variant="outline" size="icon" onClick={stop}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
