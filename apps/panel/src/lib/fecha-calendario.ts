/** Fechas de calendario (sin hora), alineadas con API @db.Date y zona Perú. */

export const ZONA_NEGOCIO = 'America/Lima';

export function esFechaCalendario(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function partesUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function claveFechaCalendario(input: Date | string): string | null {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (esFechaCalendario(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return null;
    return partesUtc(d);
  }
  return partesUtc(input);
}

export function fechaCalendarioHoy(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA_NEGOCIO });
}

export function isoFechaLocal(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: ZONA_NEGOCIO });
}

export function formatFechaCalendario(fecha: string): string {
  const [y, m, d] = fecha.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return dt.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatMesDiaCalendario(fecha: string): { mes: string; dia: string } {
  const [, , d] = fecha.split('-').map(Number);
  const dt = new Date(Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, d, 12, 0, 0));
  return {
    mes: dt
      .toLocaleDateString('es-PE', { month: 'short', timeZone: 'UTC' })
      .replace('.', '')
      .toUpperCase(),
    dia: String(d).padStart(2, '0'),
  };
}
