"use client";

import { createContext, useContext } from "react";
import { useConversations } from "@/hooks/use-conversations";

type ConversationsContextValue = ReturnType<typeof useConversations>;

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const value = useConversations();
  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversationsContext(): ConversationsContextValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error("useConversationsContext must be used inside ConversationsProvider");
  return ctx;
}
