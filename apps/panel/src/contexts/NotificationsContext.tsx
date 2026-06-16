import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  fetchNotificacionesPanel,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  ocultarTodasNotificaciones,
} from '../lib/notificaciones-api';
import type { BosquePanelEvent, PanelNotification } from '../types/bosque-panel-event';

const MAX_NOTIFICATIONS = 50;

type NotificationsState = {
  items: PanelNotification[];
  unreadCount: number;
  loading: boolean;
  pushNotification: (event: BosquePanelEvent) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

function upsertNotification(
  prev: PanelNotification[],
  entry: PanelNotification,
): PanelNotification[] {
  const without = prev.filter((n) => n.id !== entry.id);
  return [entry, ...without].slice(0, MAX_NOTIFICATIONS);
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { authRequired, user } = useAuth();
  const [items, setItems] = useState<PanelNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const persistenciaActiva = authRequired && !!user?.id;

  useEffect(() => {
    if (!persistenciaActiva) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchNotificacionesPanel()
      .then((rows) => {
        if (!cancelled) setItems(rows.slice(0, MAX_NOTIFICATIONS));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [persistenciaActiva, user?.id]);

  const pushNotification = useCallback((event: BosquePanelEvent) => {
    const entry: PanelNotification = {
      ...event,
      leida: false,
    };
    setItems((prev) => upsertNotification(prev, entry));
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
    if (persistenciaActiva) {
      void marcarTodasNotificacionesLeidas().catch(() => undefined);
    }
  }, [persistenciaActiva]);

  const markRead = useCallback(
    (id: string) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      if (persistenciaActiva) {
        void marcarNotificacionLeida(id).catch(() => undefined);
      }
    },
    [persistenciaActiva],
  );

  const clearAll = useCallback(() => {
    setItems([]);
    if (persistenciaActiva) {
      void ocultarTodasNotificaciones().catch(() => undefined);
    }
  }, [persistenciaActiva]);

  const unreadCount = useMemo(() => items.filter((n) => !n.leida).length, [items]);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      pushNotification,
      markAllRead,
      markRead,
      clearAll,
    }),
    [items, unreadCount, loading, pushNotification, markAllRead, markRead, clearAll],
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
