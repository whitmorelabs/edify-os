export type NotificationType = "checkin" | "message" | "system";

import type { ArchetypeSlug } from "@/app/dashboard/inbox/heartbeats";
export type { ArchetypeSlug };

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  archetype?: ArchetypeSlug;
  link: string;
  timestamp: string; // ISO string
  read: boolean;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
}
