"use client";

import { useEffect } from "react";
import { ChatView } from "@/components/chat/chat-view";
import { useChatContext } from "@/contexts/chat-context";

export default function Home() {
  const { startNewChat } = useChatContext();

  useEffect(() => {
    startNewChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ChatView />;
}
