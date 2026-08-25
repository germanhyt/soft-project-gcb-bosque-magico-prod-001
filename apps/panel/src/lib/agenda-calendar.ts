/** Utilidades para vista calendario mensual de agenda. */

import { fechaCalendarioHoy } from './fecha-calendario';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export function parseMesParam(mes?: string | null): { year: number; month: number } {
  const hoy = fechaCalendarioHoy();
  const [hy, hm] = hoy.split('-').map(Number);
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number);
    return { year: y, month: m - 1 };
  }
  return { year: hy, month: hm - 1 };
}

export function mesToParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function rangoMes(year: number, month: number) {
  const desde = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const hasta = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { desde, hasta };
}

/** Desde el 1 del mes actual (zona negocio) hasta el 31 de diciembre del mismo año. */
export function rangoMesActualHastaFinAnio() {
  const { year, month } = parseMesParam(null);
  const { desde } = rangoMes(year, month);
  return { desde, hasta: `${year}-12-31` };
}

export function nombreMesAnio(year: number, month: number) {
  const d = new Date(Date.UTC(year, month, 1, 12, 0, 0));
  const nombre = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export type DiaCalendario = {
  fecha: string;
  enMes: boolean;
  esHoy: boolean;
};

function isoUtc(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Celdas de 6 semanas (42 días) empezando en lunes; claves alineadas con API (@db.Date). */
export function celdasMes(year: number, month: number): DiaCalendario[] {
  const hoy = fechaCalendarioHoy();
  const first = new Date(Date.UTC(year, month, 1));
  const startPad = (first.getUTCDay() + 6) % 7;
  const cells: DiaCalendario[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(Date.UTC(year, month, 1 - startPad + i));
    const fecha = isoUtc(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    cells.push({
      fecha,
      enMes: d.getUTCMonth() === month,
      esHoy: fecha === hoy,
    });
  }
  return cells;
}

export { WEEKDAY_LABELS };
