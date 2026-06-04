import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BosquePanelEvent, PanelNotification } from '../types/bosque-panel-event';

const MAX_NOTIFICATIONS = 50;

type NotificationsState = {
  items: PanelNotification[];
  unreadCount: number;
  pushNotification: (event: BosquePanelEvent) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PanelNotification[]>([]);

  const pushNotification = useCallback((event: BosquePanelEvent) => {
    const entry: PanelNotification = {
      ...event,
      id: nextId(),
      leida: false,
    };
    setItems((prev) => [entry, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  const unreadCount = useMemo(() => items.filter((n) => !n.leida).length, [items]);

  const value = useMemo(
    () => ({ items, unreadCount, pushNotification, markAllRead, markRead, clearAll }),
    [items, unreadCount, pushNotification, markAllRead, markRead, clearAll],
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return ctx;
}
