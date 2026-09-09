function montoPositivo(valor: unknown): number | null {
  if (valor == null) return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Costo interno > 0, si no 60% del precio de venta del ítem o del catálogo. */
export function costoReferencialPedido(opts: {
  costoGuardado?: unknown;
  cantidad: number;
  costoInterno?: unknown;
  precioItem?: unknown;
  precioCatalogo?: unknown;
}): number {
  const cantidad = opts.cantidad > 0 ? opts.cantidad : 1;
  const guardado = montoPositivo(opts.costoGuardado);
  if (guardado != null) return Number(guardado.toFixed(2));

  const interno = montoPositivo(opts.costoInterno);
  if (interno != null) return Number((interno * cantidad).toFixed(2));

  const precioItem = montoPositivo(opts.precioItem);
  if (precioItem != null) return Number((precioItem * 0.6 * cantidad).toFixed(2));

  const catalogo = montoPositivo(opts.precioCatalogo);
  if (catalogo != null) return Number((catalogo * 0.6 * cantidad).toFixed(2));

  return 0;
}
