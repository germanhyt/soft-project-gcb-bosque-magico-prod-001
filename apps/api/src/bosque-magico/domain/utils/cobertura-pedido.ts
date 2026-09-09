const ETAPAS_INACTIVAS = new Set(['cancelado']);

export type PedidoCobertura = {
  tipo: string;
  etapa: string;
  productoId?: string | null;
  nombre: string;
};

export function mismoServicioPedido(
  a: Pick<PedidoCobertura, 'productoId' | 'nombre'>,
  b: Pick<PedidoCobertura, 'productoId' | 'nombre'>,
): boolean {
  if (a.productoId && b.productoId && a.productoId === b.productoId) return true;
  return a.nombre.trim().toLowerCase() === b.nombre.trim().toLowerCase();
}

export function pedidoProveedorActivo(pedido: PedidoCobertura): boolean {
  return pedido.tipo === 'proveedor' && !ETAPAS_INACTIVAS.has(pedido.etapa);
}

/** Hay un pedido de proveedor no cancelado que cubre el mismo servicio. */
export function hayCoberturaActiva(
  servicio: Pick<PedidoCobertura, 'productoId' | 'nombre'>,
  pedidos: PedidoCobertura[],
): boolean {
  return pedidos.some(
    (p) => pedidoProveedorActivo(p) && mismoServicioPedido(p, servicio),
  );
}

export function pedidosRechazadosSinCobertura(
  pedidos: PedidoCobertura[],
): PedidoCobertura[] {
  const rechazados = pedidos.filter(
    (p) => p.tipo === 'proveedor' && p.etapa === 'cancelado',
  );
  return rechazados.filter((p) => !hayCoberturaActiva(p, pedidos));
}
