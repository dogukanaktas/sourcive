"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { Conversation } from "@/types/conversation";
import type { ChatMessage } from "@/lib/llm";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isReady, setIsReady] = useState(false);
  const initDone = useRef(false);

  const supabase = getSupabaseClient();

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data as Conversation[]);
  }, [supabase]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("[useConversations] anonymous sign-in failed:", error.message, error.status);
          return;
        }
      }
      await loadConversations();
      setIsReady(true);
    };
    init();
  }, [supabase, loadConversations]);

  const createConversation = useCallback(async (id: string, title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("conversations").insert({
      id,
      user_id: user.id,
      title: title.slice(0, 60) || "New conversation",
    });
    await loadConversations();
  }, [supabase, loadConversations]);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, [supabase]);

  const loadMessages = useCallback(async (conversationId: string): Promise<ChatMessage[]> => {
    const { data } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    return (data ?? []) as ChatMessage[];
  }, [supabase]);

  const saveMessages = useCallback(async (conversationId: string, messages: ChatMessage[]) => {
    if (messages.length === 0) return;
    await supabase.from("messages").insert(
      messages.map((m) => ({
        conversation_id: conversationId,
        role: m.role,
        content: m.content,
      })),
    );
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    await loadConversations();
  }, [supabase, loadConversations]);

  return {
    conversations,
    isReady,
    createConversation,
    deleteConversation,
    loadMessages,
    saveMessages,
    reload: loadConversations,
  };
}
