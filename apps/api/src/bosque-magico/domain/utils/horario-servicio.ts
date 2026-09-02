export type HorarioServicio = {
  inicio?: string;
  fin?: string;
};

const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/;

export function normalizarHora(value?: string | null): string | undefined {
  const raw = value?.trim();
  if (!raw || !HORA.test(raw)) return undefined;
  const [h, m] = raw.split(':');
  return `${h.padStart(2, '0')}:${m}`;
}

export function formatearHorarioServicio(horario?: HorarioServicio | null): string {
  const inicio = normalizarHora(horario?.inicio);
  const fin = normalizarHora(horario?.fin);
  if (inicio && fin) return `${inicio}–${fin}`;
  if (inicio) return `desde ${inicio}`;
  if (fin) return `hasta ${fin}`;
  return '';
}

export function textoHorarioEnNotas(horario?: HorarioServicio | null): string {
  const texto = formatearHorarioServicio(horario);
  return texto ? `Horario: ${texto}` : '';
}

export function anexarHorarioANotas(
  notas: string | undefined | null,
  horario?: HorarioServicio | null,
): string | undefined {
  const base = (notas ?? '')
    .replace(/(?:^|\s·\s*)Horario:\s*.+$/u, '')
    .trim();
  const extra = textoHorarioEnNotas(horario);
  if (!extra) return base || undefined;
  return base ? `${base} · ${extra}` : extra;
}
