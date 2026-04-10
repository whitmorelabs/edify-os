'use client';

import { ChatPanelProvider } from '@/components/chat-provider';
import { Sidebar } from '@/components/sidebar';
import { ChatPanel } from '@/components/chat-panel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatPanelProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50">
          <div className="p-6 lg:p-8 max-w-6xl">{children}</div>
        </main>
        <ChatPanel />
      </div>
    </ChatPanelProvider>
  );
}
