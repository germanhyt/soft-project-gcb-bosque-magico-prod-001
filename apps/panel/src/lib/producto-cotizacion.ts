import type { Producto, TipoItem } from './cotizaciones';

export function tipoItemDesdeProducto(categoria: string): TipoItem {
  if (categoria === 'catering') return 'catering';
  if (categoria === 'show') return 'show';
  return 'extra';
}

export function productosParaCotizacion(productos: Producto[]) {
  const activos = productos.filter((p) => p.etapa !== 'inactivo');
  const catering = activos.filter((p) => p.categoria === 'catering');
  return {
    paquetes: activos.filter((p) => p.categoria === 'paquete'),
    shows: activos.filter((p) => p.categoria === 'show'),
    catering: catering.filter(
      (p) =>
        p.subtipo !== 'piqueo' && p.subtipo !== 'cajita' && p.subtipo !== 'snack',
    ),
    piqueos: catering.filter((p) => p.subtipo === 'piqueo'),
    cajitas: catering.filter((p) => p.subtipo === 'cajita'),
    snacks: catering.filter((p) => p.subtipo === 'snack'),
    extras: activos.filter((p) => p.categoria === 'extra'),
  };
}

export function cantidadItemProducto(
  producto: Producto,
  cantidadesPayload: Record<string, number>,
): number {
  const guardada = cantidadesPayload[producto.id];
  if (guardada != null) return Math.max(guardada, producto.cantidadMinima);
  if (producto.subtipo === 'piqueo') return 1;
  if (producto.categoria === 'catering') return producto.cantidadMinima;
  return 1;
}
