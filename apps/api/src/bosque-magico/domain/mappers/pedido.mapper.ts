import { fromDecimal } from '../utils/decimal';

export function mapProveedorResponse<T extends Record<string, unknown>>(proveedor: T) {
  return { ...proveedor };
}

export function mapPedidoResponse<T extends Record<string, unknown>>(pedido: T) {
  return {
    ...pedido,
    costo: fromDecimal(pedido.costo as never),
  };
}
