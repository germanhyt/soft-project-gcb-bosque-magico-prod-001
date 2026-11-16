/** Pantalla que abre el panel al ingresar. */
export const RUTA_INICIO = '/solicitudes';

const ENTRADAS_GENERICAS = new Set(['/', '/dashboard', '/login']);

/** Solicitudes al entrar. Conserva la ruta si la sesión venía de un deep link. */
export function destinoTrasIngreso(from?: string | null): string {
  if (!from || ENTRADAS_GENERICAS.has(from)) return RUTA_INICIO;
  return from;
}
