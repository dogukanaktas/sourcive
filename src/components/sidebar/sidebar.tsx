"use client";

import { usePathname, useRouter } from "next/navigation";
import { Trash2, Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversationsContext } from "@/contexts/conversations-context";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { conversations, deleteConversation } = useConversationsContext();
  const pathname = usePathname();
  const router = useRouter();

  function handleNew() {
    router.push(`/chat/${crypto.randomUUID()}`);
    onNavigate?.();
  }

  function handleSelect(id: string) {
    router.push(`/chat/${id}`);
    onNavigate?.();
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await deleteConversation(id);
    if (pathname === `/chat/${id}`) {
      router.push(`/chat/${crypto.randomUUID()}`);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b shrink-0">
        <Button
          onClick={handleNew}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">No conversations yet</p>
        ) : (
          conversations.map((c) => {
            const isActive = pathname === `/chat/${c.id}`;
            return (
              <div
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={`group flex items-start gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate leading-snug">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(c.updated_at)}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, c.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:text-destructive cursor-pointer"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
