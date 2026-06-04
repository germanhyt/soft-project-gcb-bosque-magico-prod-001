/** Utilidades para vista calendario mensual de agenda. */

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export function parseMesParam(mes?: string | null): { year: number; month: number } {
  const now = new Date();
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number);
    return { year: y, month: m - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function mesToParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function rangoMes(year: number, month: number) {
  const desde = new Date(year, month, 1);
  const hasta = new Date(year, month + 1, 0);
  return {
    desde: isoLocal(desde),
    hasta: isoLocal(hasta),
  };
}

function isoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nombreMesAnio(year: number, month: number) {
  const d = new Date(year, month, 1);
  const nombre = d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export type DiaCalendario = {
  fecha: string;
  enMes: boolean;
  esHoy: boolean;
};

/** Celdas de 6 semanas (42 días) empezando en lunes. */
export function celdasMes(year: number, month: number): DiaCalendario[] {
  const hoy = isoLocal(new Date());
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startPad);
  const cells: DiaCalendario[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const fecha = isoLocal(d);
    cells.push({
      fecha,
      enMes: d.getMonth() === month,
      esHoy: fecha === hoy,
    });
  }
  return cells;
}

export { WEEKDAY_LABELS };
