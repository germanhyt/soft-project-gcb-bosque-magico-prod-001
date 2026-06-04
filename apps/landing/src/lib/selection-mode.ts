export type SelectionMode = 'single' | 'multiple';

export const SELECTION_MODE_KEYS = {
  shows: 'cotizador.shows.selection_mode',
  catering: 'cotizador.catering.selection_mode',
  extras: 'cotizador.extras.selection_mode',
} as const;

export function getSelectionMode(
  items: { clave: string; valor: unknown }[] | undefined,
  clave: string,
  fallback: SelectionMode,
): SelectionMode {
  const valor = items?.find((item) => item.clave === clave)?.valor;
  return valor === 'single' || valor === 'multiple' ? valor : fallback;
}

export function selectionHint(mode: SelectionMode) {
  return mode === 'multiple'
    ? 'Toca una o más tarjetas para agregar al carrito.'
    : 'Toca una tarjeta para elegir (solo una opción).';
}
