'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Notification, NotificationContextType } from './types';

const STORAGE_KEY = 'edify_notification_state';
const POLL_INTERVAL = 30_000; // 30 seconds

interface PersistedState {
  readIds: string[];
  dismissedIds: string[];
}

function loadPersisted(): PersistedState {
  if (typeof window === 'undefined') return { readIds: [], dismissedIds: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { readIds: [], dismissedIds: [] };
    return JSON.parse(raw) as PersistedState;
  } catch {
    return { readIds: [], dismissedIds: [] };
  }
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  dismissNotification: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [rawNotifications, setRawNotifications] = useState<Notification[]>([]);
  const [persisted, setPersisted] = useState<PersistedState>({ readIds: [], dismissedIds: [] });
  const previousIdsRef = useRef<Set<string>>(new Set());

  // Load persisted state from localStorage on mount
  useEffect(() => {
    setPersisted(loadPersisted());
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data: Notification[] = await res.json();
      setRawNotifications(data);
    } catch {
      // silently fail — polling will retry
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Merge server data with persisted read/dismissed state
  const notifications: Notification[] = rawNotifications
    .filter((n) => !persisted.dismissedIds.includes(n.id))
    .map((n) => ({
      ...n,
      read: n.read || persisted.readIds.includes(n.id),
    }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Track newly arrived notifications for toast display
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const newIds = [...currentIds].filter((id) => !previousIdsRef.current.has(id));
    if (previousIdsRef.current.size > 0 && newIds.length > 0) {
      // Dispatch a custom event so ToastNotification can pick up new items
      window.dispatchEvent(
        new CustomEvent('edify:new-notifications', {
          detail: notifications.filter((n) => newIds.includes(n.id) && !n.read),
        })
      );
    }
    previousIdsRef.current = currentIds;
  }, [notifications]);

  const updatePersisted = (next: PersistedState) => {
    setPersisted(next);
    savePersisted(next);
  };

  const markAsRead = useCallback(
    (id: string) => {
      updatePersisted({
        ...persisted,
        readIds: persisted.readIds.includes(id)
          ? persisted.readIds
          : [...persisted.readIds, id],
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persisted]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    updatePersisted({
      ...persisted,
      readIds: [...new Set([...persisted.readIds, ...allIds])],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, persisted]);

  const dismissNotification = useCallback(
    (id: string) => {
      updatePersisted({
        ...persisted,
        dismissedIds: persisted.dismissedIds.includes(id)
          ? persisted.dismissedIds
          : [...persisted.dismissedIds, id],
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persisted]
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
