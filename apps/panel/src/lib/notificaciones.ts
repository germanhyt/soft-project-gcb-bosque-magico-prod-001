import type { BosquePanelEventType, PanelNotification } from '../types/bosque-panel-event';

export type NotificationVisual = {
  icon: string;
  iconBg: string;
  iconColor: string;
};

export function entidadNotificacionLink(
  tipo: string | undefined,
  id: string | undefined,
): string | null {
  if (!tipo || !id) return null;
  const q = encodeURIComponent(id);
  switch (tipo) {
    case 'solicitud':
      return `/solicitudes?detalle=${q}`;
    case 'cotizacion':
      return `/cotizaciones?detalle=${q}`;
    case 'evento':
      return `/agenda?detalle=${q}`;
    default:
      return null;
  }
}

export function notificationVisual(type: BosquePanelEventType): NotificationVisual {
  switch (type) {
    case 'solicitud.nueva':
      return { icon: 'inbox', iconBg: 'bg-primary-fixed/50', iconColor: 'text-primary' };
    case 'solicitud.actualizada':
      return {
        icon: 'edit_note',
        iconBg: 'bg-surface-container-high',
        iconColor: 'text-on-surface-variant',
      };
    case 'cotizacion.borrador':
      return { icon: 'draft', iconBg: 'bg-tertiary-fixed/40', iconColor: 'text-tertiary' };
    case 'cotizacion.enviada':
      return { icon: 'send', iconBg: 'bg-secondary-fixed/30', iconColor: 'text-secondary' };
    case 'cotizacion.actualizada':
      return { icon: 'receipt_long', iconBg: 'bg-secondary-fixed/30', iconColor: 'text-secondary' };
    case 'cotizacion.aceptada':
      return { icon: 'check_circle', iconBg: 'bg-primary-container/40', iconColor: 'text-primary' };
    case 'evento.actualizado':
      return { icon: 'calendar_month', iconBg: 'bg-tertiary-fixed/40', iconColor: 'text-tertiary' };
    default:
      return { icon: 'notifications', iconBg: 'bg-surface-container-high', iconColor: 'text-outline' };
  }
}

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60_000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const timeStr = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameCalendarDay(date, now)) return `Hoy ${timeStr}`;
  if (sameCalendarDay(date, yesterday)) return `Ayer ${timeStr}`;

  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFullDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Lima',
  });
}

export type NotificationGroup = 'hoy' | 'anteriores';

export function groupNotifications(items: PanelNotification[]): {
  key: NotificationGroup;
  label: string;
  items: PanelNotification[];
}[] {
  const now = new Date();
  const hoy: PanelNotification[] = [];
  const anteriores: PanelNotification[] = [];

  for (const item of items) {
    const date = new Date(item.creadoEn);
    if (!Number.isNaN(date.getTime()) && sameCalendarDay(date, now)) {
      hoy.push(item);
    } else {
      anteriores.push(item);
    }
  }

  const groups: { key: NotificationGroup; label: string; items: PanelNotification[] }[] = [];
  if (hoy.length > 0) groups.push({ key: 'hoy', label: 'Hoy', items: hoy });
  if (anteriores.length > 0) groups.push({ key: 'anteriores', label: 'Anteriores', items: anteriores });
  return groups;
}
