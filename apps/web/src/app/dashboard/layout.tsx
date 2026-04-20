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
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto bg-gray-50 pt-14 lg:pt-0">
            <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
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
