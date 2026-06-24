"use client";

import { useState } from "react";
import { PanelLeft } from "lucide-react";
import { Sidebar } from "./sidebar";
import { ConversationsProvider } from "@/contexts/conversations-context";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <ConversationsProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`shrink-0 border-r bg-background transition-all duration-200 overflow-hidden ${
            open ? "w-64" : "w-0"
          }`}
        >
          <div className="w-64 h-full">
            <Sidebar onNavigate={() => {}} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Toggle button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="absolute top-3.5 left-4 z-20 p-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
            aria-label={open ? "Close sidebar" : "Open sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          {children}
        </div>
      </div>
    </ConversationsProvider>
  );
}
