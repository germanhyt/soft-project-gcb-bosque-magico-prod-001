/** Convierte YYYY-MM-DD (o ISO que empieza así) a DD-MM-YYYY para mensajes de UI. */
export function formatFechaDdMmYyyy(isoOrClave: string): string {
  const clave = isoOrClave.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clave);
  if (!m) return isoOrClave;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

const CLAVE_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YYYY-MM-DD de una fecha de negocio (@db.Date / ISO a medianoche UTC). */
export function claveFechaCalendarioIso(isoOrClave: string): string | null {
  const clave = isoOrClave.trim().slice(0, 10);
  return CLAVE_CALENDARIO.test(clave) ? clave : null;
}

function fechaUtcMediodia(clave: string): Date | undefined {
  const m = CLAVE_CALENDARIO.exec(clave);
  if (!m) return undefined;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
}

function formatFechaCalendario(
  isoOrClave: string,
  opciones: Intl.DateTimeFormatOptions,
): string {
  const clave = claveFechaCalendarioIso(isoOrClave);
  if (!clave) return isoOrClave;
  const dt = fechaUtcMediodia(clave);
  if (!dt) return isoOrClave;
  return dt.toLocaleDateString('es-PE', { ...opciones, timeZone: 'UTC' });
}

/** 20 de septiembre de 2026 — no usa la zona local (evita un día atrás con T00:00:00.000Z). */
export function formatFechaCalendarioLarga(isoOrClave: string): string {
  return formatFechaCalendario(isoOrClave, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** 20/09/2026 */
export function formatFechaCalendarioCorta(isoOrClave: string): string {
  return formatFechaCalendario(isoOrClave, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
