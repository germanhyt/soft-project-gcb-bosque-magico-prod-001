import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext';
import { Icon } from '../ui/Icon';

function entidadLink(tipo: string | undefined, id: string | undefined) {
  if (!tipo || !id) return null;
  if (tipo === 'solicitud') return `/solicitudes/${id}`;
  if (tipo === 'cotizacion') return `/cotizaciones/${id}`;
  return null;
}

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function NotificationsDropdown() {
  const { items, unreadCount, markAllRead, markRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative cursor-pointer transition-colors hover:text-primary-container"
        aria-expanded={open}
        aria-label="Notificaciones"
      >
        <Icon name="notifications" filled={unreadCount > 0} size={24}  className="text-primary"/>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-[min(24rem,70vh)] overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-ambient">
          <div className="flex items-center justify-between border-b border-surface-variant px-4 py-3">
            <p className="font-semibold text-on-surface">Notificaciones</p>
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
          <ul className="overflow-y-auto max-h-72">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-body-sm text-outline">
                Sin notificaciones recientes
              </li>
            ) : (
              items.map((n) => {
                const href = entidadLink(n.entidad?.tipo, n.entidad?.id);
                const content = (
                  <>
                    <p className="font-semibold text-on-surface text-sm">{n.titulo}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">{n.mensaje}</p>
                    <p className="mt-1 text-[10px] text-outline">{formatHora(n.creadoEn)}</p>
                  </>
                );
                return (
                  <li
                    key={n.id}
                    className={`border-b border-surface-variant/50 px-4 py-3 last:border-0 ${
                      !n.leida ? 'bg-primary-fixed/15' : ''
                    }`}
                  >
                    {href ? (
                      <Link
                        to={href}
                        onClick={() => {
                          markRead(n.id);
                          setOpen(false);
                        }}
                        className="block hover:opacity-90"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => markRead(n.id)}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
