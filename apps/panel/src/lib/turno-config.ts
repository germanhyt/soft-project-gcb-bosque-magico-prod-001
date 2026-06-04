import type { TurnoConfigValor } from './configuracion';

const DEFAULTS: Record<string, { horaInicio: string; horaFin: string; etiqueta: string }> = {
  'turnos.turno_1': { etiqueta: 'Turno 1', horaInicio: '09:00', horaFin: '12:00' },
  'turnos.turno_2': { etiqueta: 'Turno 2', horaInicio: '14:00', horaFin: '17:00' },
  'turnos.turno_3': { etiqueta: 'Turno 3', horaInicio: '19:00', horaFin: '22:00' },
};

function formatHora12(hhmm: string) {
  const [hStr, mStr] = hhmm.split(':');
  let h = Number(hStr);
  const m = mStr ?? '00';
  const ampm = h >= 12 ? 'p.m.' : 'a.m.';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

export function horarioDesdeRango(horaInicio: string, horaFin: string) {
  return `${formatHora12(horaInicio)} - ${formatHora12(horaFin)}`;
}

export function parseTurnoConfig(clave: string, valor: unknown): TurnoConfigValor {
  const def = DEFAULTS[clave] ?? { etiqueta: '', horaInicio: '09:00', horaFin: '12:00' };
  if (!valor || typeof valor !== 'object') {
    return { etiqueta: def.etiqueta, horaInicio: def.horaInicio, horaFin: def.horaFin };
  }
  const v = valor as Record<string, unknown>;
  const etiqueta = String(v.etiqueta ?? def.etiqueta);
  if (typeof v.horaInicio === 'string' && typeof v.horaFin === 'string') {
    return {
      etiqueta,
      horaInicio: v.horaInicio,
      horaFin: v.horaFin,
      horario: horarioDesdeRango(v.horaInicio, v.horaFin),
    };
  }
  const horario = typeof v.horario === 'string' ? v.horario : '';
  return {
    etiqueta,
    horaInicio: def.horaInicio,
    horaFin: def.horaFin,
    horario: horario || horarioDesdeRango(def.horaInicio, def.horaFin),
  };
}

export function turnoParaGuardar(t: TurnoConfigValor): TurnoConfigValor {
  return {
    etiqueta: t.etiqueta.trim(),
    horaInicio: t.horaInicio,
    horaFin: t.horaFin,
    horario: horarioDesdeRango(t.horaInicio, t.horaFin),
  };
}
