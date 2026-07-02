"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { useChatContext } from "@/contexts/chat-context";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const { loadConversation } = useChatContext();

  useEffect(() => {
    loadConversation(conversationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return <ChatView />;
}
