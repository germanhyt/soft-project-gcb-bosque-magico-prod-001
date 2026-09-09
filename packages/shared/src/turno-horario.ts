import {
  formatearHorarioServicio,
  normalizarHora,
} from './horario-servicio.js';

export const TURNO_PERSONALIZADO = 'turno_personalizado';
export const DURACION_TURNO_HORAS = 3;

const TURNO_LABEL: Record<string, string> = {
  turno_1: 'Turno 1',
  turno_2: 'Turno 2',
  turno_3: 'Turno 3',
  turno_personalizado: 'Turno personalizado',
};

/** Rangos típicos (seed/config) para ocupación cuando no hay horas persistidas. */
export const HORARIO_TURNO_ESTANDAR: Record<string, { inicio: string; fin: string }> = {
  turno_1: { inicio: '09:00', fin: '12:00' },
  turno_2: { inicio: '14:00', fin: '17:00' },
  turno_3: { inicio: '19:00', fin: '22:00' },
};

const MINUTOS_DIA = 24 * 60;

export function esTurnoPersonalizado(turno?: string | null): boolean {
  return turno === TURNO_PERSONALIZADO;
}

export function minutosDesdeMedianoche(hhmm: string): number | undefined {
  const n = normalizarHora(hhmm);
  if (!n) return undefined;
  const [h, m] = n.split(':').map(Number);
  return h * 60 + m;
}

function hhmmDesdeMinutos(total: number): string {
  const wrapped = ((total % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function sumarHoras(hhmm: string, horas: number): string | undefined {
  const start = minutosDesdeMedianoche(hhmm);
  if (start == null || !Number.isFinite(horas)) return undefined;
  return hhmmDesdeMinutos(start + horas * 60);
}

export function rangoTurnoPersonalizado(
  inicio?: string | null,
): { inicio: string; fin: string } | undefined {
  const start = normalizarHora(inicio);
  if (!start) return undefined;
  const fin = sumarHoras(start, DURACION_TURNO_HORAS);
  if (!fin) return undefined;
  return { inicio: start, fin };
}

export function resolverHorarioTurno(
  turno: string,
  inicioPersonalizado?: string | null,
  rangoEstandar?: { inicio?: string | null; fin?: string | null } | null,
): { inicio: string; fin: string } | undefined {
  if (esTurnoPersonalizado(turno)) {
    return rangoTurnoPersonalizado(inicioPersonalizado);
  }
  const inicio = normalizarHora(rangoEstandar?.inicio);
  const fin = normalizarHora(rangoEstandar?.fin);
  if (inicio && fin) return { inicio, fin };
  return undefined;
}

export function etiquetaTurno(
  turno?: string | null,
  horarioInicio?: string | null,
  horarioFin?: string | null,
): string {
  if (!turno) return '';
  if (esTurnoPersonalizado(turno)) {
    const rango = formatearHorarioServicio({
      inicio: horarioInicio ?? undefined,
      fin: horarioFin ?? undefined,
    });
    return rango
      ? `Turno personalizado (${rango})`
      : TURNO_LABEL[TURNO_PERSONALIZADO];
  }
  return TURNO_LABEL[turno] ?? turno;
}

function intervalosMinutos(
  inicio: number,
  fin: number,
): Array<[number, number]> {
  if (fin <= inicio) return [[inicio, MINUTOS_DIA], [0, fin]];
  return [[inicio, fin]];
}

function horasSlot(slot: {
  turno: string;
  inicio?: string | null;
  fin?: string | null;
}): { inicio: string; fin: string } | undefined {
  const inicio = normalizarHora(slot.inicio);
  const fin = normalizarHora(slot.fin);
  if (inicio && fin) return { inicio, fin };
  return HORARIO_TURNO_ESTANDAR[slot.turno];
}

export function hayConflictoTurno(
  candidato: { turno: string; inicio?: string | null; fin?: string | null },
  ocupados: Array<{ turno: string; inicio?: string | null; fin?: string | null }>,
): boolean {
  const horasCandidato = horasSlot(candidato);
  for (const ocupado of ocupados) {
    const horasOcupado = horasSlot(ocupado);
    if (horasCandidato && horasOcupado) {
      if (
        solapanHorarios(
          horasCandidato.inicio,
          horasCandidato.fin,
          horasOcupado.inicio,
          horasOcupado.fin,
        )
      ) {
        return true;
      }
      continue;
    }
    if (ocupado.turno === candidato.turno) return true;
  }
  return false;
}

export function solapanHorarios(
  aInicio: string,
  aFin: string,
  bInicio: string,
  bFin: string,
): boolean {
  const a1 = minutosDesdeMedianoche(aInicio);
  const a2 = minutosDesdeMedianoche(aFin);
  const b1 = minutosDesdeMedianoche(bInicio);
  const b2 = minutosDesdeMedianoche(bFin);
  if (a1 == null || a2 == null || b1 == null || b2 == null) return false;
  for (const [x1, x2] of intervalosMinutos(a1, a2)) {
    for (const [y1, y2] of intervalosMinutos(b1, b2)) {
      if (x1 < y2 && y1 < x2) return true;
    }
  }
  return false;
}
