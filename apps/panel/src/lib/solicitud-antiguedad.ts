/** Umbrales de antigüedad para solicitudes en estado Nueva (sin tomar). */
export type NivelAntiguedadSolicitud = 'reciente' | 'atencion' | 'urgente';

const MS_HORA = 60 * 60 * 1000;

export function horasDesde(iso: string, ahora = Date.now()): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (ahora - t) / MS_HORA);
}

/** <1h reciente · 1–24h atención · ≥24h urgente */
export function nivelAntiguedadSolicitudNueva(
  creadoEn: string,
  ahora = Date.now(),
): NivelAntiguedadSolicitud {
  const h = horasDesde(creadoEn, ahora);
  if (h >= 24) return 'urgente';
  if (h >= 1) return 'atencion';
  return 'reciente';
}

export function etiquetaAntiguedad(nivel: NivelAntiguedadSolicitud): string {
  if (nivel === 'urgente') return 'Sin tomar · +24h';
  if (nivel === 'atencion') return 'Sin tomar · +1h';
  return 'Sin tomar';
}

export function claseAntiguedadBadge(nivel: NivelAntiguedadSolicitud): string {
  if (nivel === 'urgente') return 'bg-error/15 text-error';
  if (nivel === 'atencion') return 'bg-tertiary-fixed/60 text-tertiary';
  return 'bg-primary-fixed/40 text-primary';
}
