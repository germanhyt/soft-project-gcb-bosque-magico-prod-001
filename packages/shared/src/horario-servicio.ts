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

export function parseHorarioDesdeNotas(notas?: string | null): HorarioServicio | undefined {
  if (!notas) return undefined;
  const rango = notas.match(/Horario:\s*(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (rango) {
    return {
      inicio: normalizarHora(rango[1]),
      fin: normalizarHora(rango[2]),
    };
  }
  const desde = notas.match(/Horario:\s*desde\s+(\d{1,2}:\d{2})/);
  if (desde) return { inicio: normalizarHora(desde[1]) };
  const hasta = notas.match(/Horario:\s*hasta\s+(\d{1,2}:\d{2})/);
  if (hasta) return { fin: normalizarHora(hasta[1]) };
  return undefined;
}

export function horariosConValor(
  horarios?: Record<string, HorarioServicio> | null,
): Array<{ productoId: string; inicio?: string; fin?: string }> | undefined {
  if (!horarios) return undefined;
  const list = Object.entries(horarios)
    .map(([productoId, h]) => ({
      productoId,
      inicio: normalizarHora(h.inicio),
      fin: normalizarHora(h.fin),
    }))
    .filter((h) => h.inicio || h.fin);
  return list.length ? list : undefined;
}
