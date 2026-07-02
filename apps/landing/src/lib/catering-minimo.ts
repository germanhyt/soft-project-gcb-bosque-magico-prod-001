import type { ConfiguracionItem, ProductoCatalogo } from './api';

export const CATERING_MINIMO_DEFAULT = 18;

export function minimoCateringDesdeConfig(
  items: ConfiguracionItem[] | undefined,
): number {
  const minimo = items?.find((i) => i.clave === 'catering.minimo_unidades')?.valor;
  return typeof minimo === 'number' && minimo > 0 ? minimo : CATERING_MINIMO_DEFAULT;
}

export function minimoUnidadesCatering(
  producto: Pick<ProductoCatalogo, 'cantidadMinima'> | undefined,
  minimoGlobal = CATERING_MINIMO_DEFAULT,
): number {
  const delProducto = producto?.cantidadMinima ?? minimoGlobal;
  return Math.max(delProducto, minimoGlobal);
}
