import { fromDecimal } from '../utils/decimal';

export function mapProductoResponse<T extends Record<string, unknown>>(
  producto: T,
) {
  return {
    ...producto,
    precioLunesViernes: fromDecimal(producto.precioLunesViernes as never),
    precioFinSemana: fromDecimal(producto.precioFinSemana as never),
    costoInterno:
      producto.costoInterno != null
        ? fromDecimal(producto.costoInterno as never)
        : null,
  };
}
