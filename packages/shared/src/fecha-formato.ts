/** Convierte YYYY-MM-DD (o ISO que empieza así) a DD-MM-YYYY para mensajes de UI. */
export function formatFechaDdMmYyyy(isoOrClave: string): string {
  const clave = isoOrClave.trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clave);
  if (!m) return isoOrClave;
  return `${m[3]}-${m[2]}-${m[1]}`;
}
