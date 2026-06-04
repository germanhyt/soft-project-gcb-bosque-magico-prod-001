/** Enlaces de contacto (wa.me / mailto) alineados con API identidad-contacto. */

export function celularParaWaMe(celular: string): string {
  const digitos = celular.replace(/\D/g, '');
  if (digitos.startsWith('51') && digitos.length >= 11) return digitos;
  const base = digitos.length >= 9 ? digitos.slice(-9) : digitos;
  return base ? `51${base}` : digitos;
}

export function linkWaMe(celular: string, texto?: string): string {
  const wa = celularParaWaMe(celular);
  const base = `https://wa.me/${wa}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

export function linkMailto(correo: string, asunto?: string, cuerpo?: string): string {
  const params = new URLSearchParams();
  if (asunto) params.set('subject', asunto);
  if (cuerpo) params.set('body', cuerpo);
  const q = params.toString();
  return q ? `mailto:${correo}?${q}` : `mailto:${correo}`;
}
