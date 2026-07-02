"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat, type UseChatReturn } from "@/hooks/use-chat";
import { useConversationsContext } from "@/contexts/conversations-context";

interface ChatContextValue extends UseChatReturn {
  conversationId: string | null;
  dbLoaded: boolean;
  onSubmit: (e: React.FormEvent) => void;
  loadConversation: (id: string) => void;
  startNewChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const chat = useChat();
  const { createConversation, loadMessages, saveMessages, isReady } = useConversationsContext();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [dbLoaded, setDbLoaded] = useState(true);
  const savedCountRef = useRef(0);
  const conversationCreatedRef = useRef(false);

  const loadConversation = useCallback((id: string) => {
    setConversationId((prev) => {
      if (prev === id) return prev;
      savedCountRef.current = 0;
      conversationCreatedRef.current = false;
      setDbLoaded(false);
      chat.resetWithMessages([]);
      return id;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewChat = useCallback(() => {
    setConversationId(null);
    setDbLoaded(true);
    savedCountRef.current = 0;
    conversationCreatedRef.current = false;
    chat.clearMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages once we know which conversation is active & DB ready
  useEffect(() => {
    if (!conversationId || !isReady || dbLoaded) return;
    loadMessages(conversationId).then((msgs) => {
      if (msgs.length > 0) {
        chat.resetWithMessages(msgs);
        savedCountRef.current = msgs.length;
        conversationCreatedRef.current = true;
      }
      setDbLoaded(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isReady, dbLoaded]);

  // Persist newly streamed messages
  useEffect(() => {
    if (!conversationId) return;
    if (!chat.isLoading && dbLoaded && chat.messages.length > savedCountRef.current) {
      const unsaved = chat.messages.slice(savedCountRef.current);
      const last = unsaved[unsaved.length - 1];
      if (last?.role === "assistant" && last.content === "") return;
      saveMessages(conversationId, unsaved).then(() => {
        savedCountRef.current = chat.messages.length;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.isLoading, conversationId]);

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const content = chat.input.trim();
    if (!content || chat.isLoading) return;

    if (!conversationId) {
      const id = crypto.randomUUID();
      conversationCreatedRef.current = true;
      setConversationId(id);
      setDbLoaded(true);
      createConversation(id, content);
      router.replace(`/chat/${id}`);
      chat.handleSubmit(e);
      return;
    }

    if (!conversationCreatedRef.current) {
      conversationCreatedRef.current = true;
      createConversation(conversationId, content);
    }
    chat.handleSubmit(e);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.input, chat.isLoading, chat.handleSubmit, conversationId, createConversation, router]);

  return (
    <ChatContext.Provider value={{ ...chat, conversationId, dbLoaded, onSubmit, loadConversation, startNewChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}
