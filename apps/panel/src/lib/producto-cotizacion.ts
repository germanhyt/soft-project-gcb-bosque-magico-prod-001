import type { Producto, TipoItem } from './cotizaciones';

export function tipoItemDesdeProducto(categoria: string): TipoItem {
  if (categoria === 'catering') return 'catering';
  if (categoria === 'show') return 'show';
  if (categoria === 'extra') return 'extra';
  return 'manual';
}

export function productosParaCotizacion(productos: Producto[]) {
  const activos = productos.filter((p) => p.etapa !== 'inactivo');
  return {
    paquetes: activos.filter((p) => p.categoria === 'paquete'),
    shows: activos.filter((p) => p.categoria === 'show'),
    catering: activos.filter((p) => p.categoria === 'catering'),
    extras: activos.filter((p) => p.categoria === 'extra'),
  };
}

export function cantidadItemProducto(
  producto: Producto,
  cantidadesPayload: Record<string, number>,
): number {
  const guardada = cantidadesPayload[producto.id];
  if (guardada != null) return Math.max(guardada, producto.cantidadMinima);
  return producto.categoria === 'catering' ? producto.cantidadMinima : 1;
}
