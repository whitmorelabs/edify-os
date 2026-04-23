'use client';

import { Sidebar } from '@/components/sidebar';
import { SupportChatProvider } from '@/components/support/ChatProvider';
import { ChatWidget } from '@/components/support/ChatWidget';
import { ProactiveHelper } from '@/components/support/ProactiveHelper';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { ToastNotification } from '@/components/notifications/ToastNotification';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <SupportChatProvider>
        <div className="flex h-screen overflow-hidden bg-bg-1 text-fg-1">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto bg-bg-1 pt-14 lg:pt-0">
            <div className="w-full max-w-[1280px] mx-auto px-6 py-8 lg:px-10 lg:py-10">
              {children}
            </div>
          </main>
        </div>
        {/* Support chat widget -- visible on all dashboard pages */}
        <ChatWidget />
        <ProactiveHelper />
        {/* Real-time toast alerts */}
        <ToastNotification />
      </SupportChatProvider>
    </NotificationProvider>
  );
}
