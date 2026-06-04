import type { EtapaSolicitud, MotivoCierre } from '../lib/api';

export const TURNOS = [
  { value: 'turno_1', label: 'Turno 1 - 9:00 a.m. - 12:00 m.' },
  { value: 'turno_2', label: 'Turno 2 - 2:00 p.m. - 5:00 p.m.' },
  { value: 'turno_3', label: 'Turno 3 - 7:00 p.m. - 10:00 p.m.' },
] as const;

export const ETAPA_LABEL: Record<EtapaSolicitud, string> = {
  nueva: 'Nueva',
  en_atencion: 'En atención',
  cotizada: 'Cotizada',
  cerrada: 'Cerrada',
};

export const CANAL_LABEL: Record<string, string> = {
  landing: 'Landing',
  whatsapp: 'WhatsApp',
  meta: 'Meta',
  referido: 'Referido',
  manual: 'Manual',
  otro: 'Otro',
};

export const TURNO_LABEL: Record<string, string> = {
  turno_1: 'Turno 1',
  turno_2: 'Turno 2',
  turno_3: 'Turno 3',
};

export const MOTIVO_CIERRE_LABEL: Record<MotivoCierre, string> = {
  ganada: 'Ganada',
  perdida: 'Perdida',
  duplicada: 'Duplicada',
  sin_respuesta: 'Sin respuesta',
  otro: 'Otro',
};

export const ETAPAS_FILTRO: { value: '' | EtapaSolicitud; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'nueva', label: 'Nueva' },
  { value: 'en_atencion', label: 'En atención' },
  { value: 'cotizada', label: 'Cotizada' },
  { value: 'cerrada', label: 'Cerrada' },
];
