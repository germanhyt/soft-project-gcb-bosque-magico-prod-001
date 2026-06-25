import type { OrigenItemCotizacion, Producto } from './cotizaciones';

const ORIGEN_LABEL: Record<OrigenItemCotizacion, string> = {
  incluido_paquete: 'Incluido',
  excedente_paquete: 'Excedente',
  adicional: 'Adicional',
  manual: 'Manual',
};

export function etiquetaOrigenItem(origen?: OrigenItemCotizacion): string | null {
  if (!origen) return null;
  return ORIGEN_LABEL[origen] ?? origen;
}

export function descripcionCantidadProducto(
  producto: Pick<Producto, 'subtipo' | 'unidadesPack'> | undefined,
  cantidad: number,
): string {
  if (producto?.subtipo === 'piqueo') {
    const uds = producto.unidadesPack ?? 1;
    return cantidad === 1
      ? `1 pack (${uds} uds)`
      : `${cantidad} packs (${uds} uds c/u)`;
  }
  return `× ${cantidad}`;
}

export function descripcionPrecioProducto(producto: Pick<Producto, 'subtipo'> | undefined): string {
  return producto?.subtipo === 'piqueo' ? 'precio por pack' : 'precio unitario';
}
