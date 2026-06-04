"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage } from "@/lib/llm";

export type { ChatMessage };

export interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  stop: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    [],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const content = input.trim();
      if (!content || isLoading) return;

      // Optimistically append the user message and clear the input.
      const userMessage: ChatMessage = { role: "user", content };
      const nextMessages: ChatMessage[] = [
        ...messages,
        userMessage,
        { role: "assistant", content: "" }, // placeholder for the streaming reply
      ];
      setMessages(nextMessages);
      setInput("");
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => "");
          throw new Error(body || `HTTP ${res.status}`);
        }

        // Read the SSE byte stream and accumulate text deltas into the last message.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Chunks may not align with SSE event boundaries — buffer and split on
          // the double-newline separator that terminates each SSE event.
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          // Keep the last (possibly incomplete) segment in the buffer.
          buffer = events.pop() ?? "";

          for (const event of events) {
            // Each SSE event line looks like: `data: {...}`
            const line = event.trim();
            if (!line.startsWith("data: ")) continue;

            let parsed: { type: string; text?: string; error?: string };
            try {
              parsed = JSON.parse(line.slice("data: ".length));
            } catch {
              continue;
            }

            if (parsed.type === "delta" && parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + parsed.text,
                };
                return updated;
              });
            } else if (parsed.type === "error") {
              throw new Error(parsed.error ?? "stream error");
            }
            // "done" event: nothing to do, the while-loop will end naturally.
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setMessages((prev) =>
          prev[prev.length - 1]?.content === ""
            ? prev.slice(0, -1)
            : prev,
        );
        setError((err as Error).message ?? "Bir hata oluştu.");
        console.error("[useChat]", err);
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [input, isLoading, messages],
  );

  return { messages, input, isLoading, error, handleInputChange, handleSubmit, stop };
}
