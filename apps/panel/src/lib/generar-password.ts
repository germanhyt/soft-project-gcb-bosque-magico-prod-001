const CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';

/** Genera contraseña aleatoria legible (sin caracteres ambiguos 0/O, 1/l/I). */
export function generarPassword(longitud = 12): string {
  const n = Math.max(8, Math.min(longitud, 32));
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join('');
}
