/** Normalización alineada con detección de duplicados en landing (celular + correo). */

export function normalizarCelular(celular: string): string {
  const digitos = celular.replace(/\D/g, '');
  if (digitos.length >= 9) return digitos.slice(-9);
  return digitos;
}

export function normalizarCorreo(correo?: string | null): string | null {
  const limpio = correo?.trim().toLowerCase();
  if (!limpio || !limpio.includes('@')) return null;
  return limpio;
}

export function celularParaWaMe(celular: string): string {
  const digitos = celular.replace(/\D/g, '');
  if (digitos.startsWith('51') && digitos.length >= 11) return digitos;
  const base = normalizarCelular(celular);
  return base ? `51${base}` : digitos;
}

export function identidadCoincide(
  a: { celular: string; correo?: string | null },
  b: { celular: string; correo?: string | null },
): boolean {
  if (normalizarCelular(a.celular) === normalizarCelular(b.celular))
    return true;
  const ca = normalizarCorreo(a.correo);
  const cb = normalizarCorreo(b.correo);
  return !!(ca && cb && ca === cb);
}
