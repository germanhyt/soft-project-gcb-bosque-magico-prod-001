import type { EtapaCotizacion } from '@prisma/client';
import { fromDecimal } from '../utils/decimal';

export type CotizacionConItems = {
  id: string;
  codigo: string;
  etapa: EtapaCotizacion;
  tokenPublico: string;
  montoBase: unknown;
  montoNinosExtra: unknown;
  montoItems: unknown;
  montoTotal: unknown;
  items?: Array<{
    id: string;
    tipo: string;
    nombre: string;
    cantidad: number;
    precioUnitario: unknown;
    subtotal: unknown;
    productoId: string | null;
    notas: string | null;
    origenItem?: string;
    creditoAplicado?: unknown;
  }>;
  [key: string]: unknown;
};

export type CotizacionResponse = CotizacionConItems & {
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  linkPublico: string;
  linkPdfPublico: string;
  items?: Array<{
    id: string;
    tipo: string;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    productoId: string | null;
    notas: string | null;
    origenItem?: string;
    creditoAplicado?: unknown;
  }>;
};

export function mapCotizacionResponse(
  cot: CotizacionConItems,
): CotizacionResponse {
  const items = cot.items?.map((item) => ({
    id: item.id,
    tipo: item.tipo,
    nombre: item.nombre,
    cantidad: item.cantidad,
    precioUnitario: fromDecimal(item.precioUnitario as never),
    subtotal: fromDecimal(item.subtotal as never),
    productoId: item.productoId,
    notas: item.notas,
    origenItem: (item as { origenItem?: string }).origenItem,
    creditoAplicado:
      (item as { creditoAplicado?: unknown }).creditoAplicado != null
        ? fromDecimal((item as { creditoAplicado: unknown }).creditoAplicado as never)
        : null,
  }));

  return {
    ...cot,
    montoBase: fromDecimal(cot.montoBase as never),
    montoNinosExtra: fromDecimal(cot.montoNinosExtra as never),
    montoItems: fromDecimal(cot.montoItems as never),
    montoTotal: fromDecimal(cot.montoTotal as never),
    linkPublico: `/cotizacion/${cot.tokenPublico}`,
    linkPdfPublico: `/cotizacion/${cot.tokenPublico}/pdf`,
    items,
  };
}
