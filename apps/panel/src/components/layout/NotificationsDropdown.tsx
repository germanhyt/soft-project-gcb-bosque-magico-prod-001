import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext';
import {
  entidadNotificacionLink,
  formatFullDateTime,
  formatRelativeTime,
  groupNotifications,
  notificationVisual,
} from '../../lib/notificaciones';
import type { PanelNotification } from '../../types/bosque-panel-event';
import { Icon } from '../ui/Icon';

type FilterMode = 'all' | 'unread';

function NotificationItem({
  notification,
  onNavigate,
  onMarkRead,
}: {
  notification: PanelNotification;
  onNavigate: () => void;
  onMarkRead: (id: string) => void;
}) {
  const href = entidadNotificacionLink(notification.entidad?.tipo, notification.entidad?.id);
  const visual = notificationVisual(notification.type);
  const relative = formatRelativeTime(notification.creadoEn);
  const fullTime = formatFullDateTime(notification.creadoEn);

  const body = (
    <div className="flex gap-3">
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${visual.iconBg}`}
        aria-hidden
      >
        <Icon name={visual.icon} size={18} className={visual.iconColor} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-snug text-on-surface">{notification.titulo}</p>
          {!notification.leida && (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label="No leída"
            />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
          {notification.mensaje}
        </p>
        <p className="mt-1.5 text-[11px] text-outline" title={fullTime}>
          {relative}
        </p>
      </div>
    </div>
  );

  const itemClass = `border-b border-surface-variant/50 px-4 py-3 last:border-0 transition-colors ${
    !notification.leida ? 'bg-primary-fixed/10 hover:bg-primary-fixed/20' : 'hover:bg-surface-container-low'
  }`;

  if (href) {
    return (
      <li className={itemClass}>
        <Link
          to={href}
          onClick={() => {
            onMarkRead(notification.id);
            onNavigate();
          }}
          className="block rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li className={itemClass}>
      <button
        type="button"
        className="w-full rounded-lg text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => onMarkRead(notification.id)}
      >
        {body}
      </button>
    </li>
  );
}

export function NotificationsDropdown() {
  const { items, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterMode>('all');
  const ref = useRef<HTMLDivElement>(null);
  const panelId = 'panel-notificaciones';

  const visibleItems = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.leida) : items),
    [filter, items],
  );

  const groups = useMemo(() => groupNotifications(visibleItems), [visibleItems]);

  useEffect(() => {
    if (!open) return;

    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setFilter('all');
  }, [open]);

  const unreadLabel =
    unreadCount === 0
      ? 'Al día'
      : unreadCount === 1
        ? '1 sin leer'
        : `${unreadCount} sin leer`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-surface-variant text-primary transition hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? panelId : undefined}
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : 'Notificaciones'
        }
      >
        <Icon name="notifications" filled={unreadCount > 0} size={22} />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span
              className="absolute inset-0 rounded-lg ring-2 ring-error/30 ring-offset-1 ring-offset-surface"
              aria-hidden
            />
          </>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Panel de notificaciones"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-ambient sm:w-96"
        >
          <div className="border-b border-surface-variant px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-on-surface">Notificaciones</p>
                <p className="mt-0.5 text-xs text-outline">{unreadLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Marcar leídas
                  </button>
                )}
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-semibold text-outline hover:text-on-surface-variant hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div
                className="mt-3 flex gap-1 rounded-lg bg-surface-container-low p-1"
                role="tablist"
                aria-label="Filtrar notificaciones"
              >
                {(
                  [
                    { id: 'all' as const, label: 'Todas' },
                    { id: 'unread' as const, label: 'Sin leer' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                      filter === tab.id
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-outline hover:text-on-surface-variant'
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
            {visibleItems.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low">
                  <Icon name="notifications_off" size={26} className="text-outline" filled={false} />
                </span>
                <p className="mt-3 text-sm font-semibold text-on-surface">
                  {filter === 'unread' ? 'No hay pendientes' : 'Sin notificaciones'}
                </p>
                <p className="mt-1 max-w-56 text-xs text-outline">
                  {filter === 'unread'
                    ? 'Ya revisaste todo lo reciente.'
                    : 'Los avisos en tiempo real aparecerán aquí.'}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <section key={group.key} aria-label={group.label}>
                  <p className="sticky top-0 z-10 border-b border-surface-variant/60 bg-surface-container-low/95 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-outline backdrop-blur-sm">
                    {group.label}
                  </p>
                  <ul>
                    {group.items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onMarkRead={markRead}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
