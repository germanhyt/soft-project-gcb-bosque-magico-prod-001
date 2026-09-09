export const CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA =
  'flujo.cotizacion_volver_borrador_aceptada';

/** Ausente o cualquier valor distinto de false = habilitado (default ON). */
export function flujoVolverBorradorAceptadaHabilitado(valor: unknown): boolean {
  return valor !== false;
}
