import type { Producto, TipoItem } from './cotizaciones';

export function tipoItemDesdeProducto(categoria: string): TipoItem {
  if (categoria === 'catering') return 'catering';
  if (categoria === 'show') return 'show';
  return 'extra';
}

export function productosParaCotizacion(productos: Producto[]) {
  const activos = productos.filter(
    (p) => p.etapa !== 'inactivo' && p.codigo !== 'EXT-DECOR',
  );
  const catering = activos.filter((p) => p.categoria === 'catering');
  const ordenPaquete = (nombre: string) => {
    const n = nombre
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    if (n.includes('basico')) return 0;
    if (n.includes('estandar') || n.includes('standar')) return 1;
    if (n.includes('premiu')) return 2;
    if (n.includes('personal')) return 3;
    return 99;
  };

  return {
    paquetes: activos
      .filter((p) => p.categoria === 'paquete')
      .sort((a, b) => ordenPaquete(a.nombre) - ordenPaquete(b.nombre) || a.nombre.localeCompare(b.nombre, 'es')),
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
