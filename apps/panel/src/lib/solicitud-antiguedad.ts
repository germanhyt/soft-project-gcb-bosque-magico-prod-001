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
  if (nivel === 'urgente') return '+24h';
  if (nivel === 'atencion') return '+1h';
  return '';
}

/** Clase discreta para el hint de antigüedad junto al badge de estado. */
export function claseAntiguedadHint(nivel: NivelAntiguedadSolicitud): string {
  if (nivel === 'urgente') return 'text-error/80';
  if (nivel === 'atencion') return 'text-tertiary/90';
  return 'text-outline';
}
