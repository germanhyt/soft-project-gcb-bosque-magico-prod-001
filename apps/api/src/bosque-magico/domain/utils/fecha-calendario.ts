/** Fechas de calendario (sin hora), alineadas con columnas @db.Date y zona de negocio Perú. */

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

/** Clave YYYY-MM-DD para agrupar o filtrar (DATE de Prisma = medianoche UTC). */
export function claveFechaCalendario(input: Date | string): string {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (esFechaCalendario(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return trimmed.slice(0, 10);
    return partesUtc(d);
  }
  return partesUtc(input);
}

export function fechaCalendarioHoy(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA_NEGOCIO });
}

export function inicioDiaCalendarioUtc(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

export function finDiaCalendarioUtc(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

export function parseFechaCalendarioUtc(fecha: string): Date {
  const trimmed = fecha.trim();
  const clave = esFechaCalendario(trimmed) ? trimmed : claveFechaCalendario(trimmed);
  if (!esFechaCalendario(clave)) {
    throw new Error(`Fecha de calendario inválida: ${fecha}`);
  }
  return inicioDiaCalendarioUtc(clave);
}
