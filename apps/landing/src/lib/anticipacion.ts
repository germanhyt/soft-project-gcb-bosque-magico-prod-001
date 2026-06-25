import type { ConfiguracionItem } from './api';

export const MIN_DIAS_ANTICIPACION_DEFAULT = 7;

export function minDiasAnticipacionDesdeConfig(
  items: ConfiguracionItem[] | undefined,
): number {
  const raw = items?.find((i) => i.clave === 'solicitud.min_dias_anticipacion')?.valor;
  if (typeof raw !== 'number' || Number.isNaN(raw) || raw < 0) {
    return MIN_DIAS_ANTICIPACION_DEFAULT;
  }
  return Math.floor(raw);
}

/** Fecha mínima YYYY-MM-DD (zona Perú, contando desde hoy). */
export function fechaMinimaEvento(minDias: number): string {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const [y, m, d] = hoy.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  base.setUTCDate(base.getUTCDate() + minDias);
  const yy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function mensajeAnticipacion(minDias: number): string {
  if (minDias === 7) return 'Solicita con al menos 1 semana de anticipación.';
  if (minDias === 1) return 'Solicita con al menos 1 día de anticipación.';
  return `Solicita con al menos ${minDias} días de anticipación.`;
}
