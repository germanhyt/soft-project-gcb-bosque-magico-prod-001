import type { QuoteBuilderSelection } from '../types/quote-builder';
import type { SeleccionPaquetePayload } from './api';

export function buildSeleccionPaquete(
  selection: QuoteBuilderSelection,
): SeleccionPaquetePayload {
  const adicionales = [
    ...selection.cateringIds.map((id) => ({
      productoId: id,
      cantidad: Math.max(selection.cateringCantidades[id] ?? 1, 1),
    })),
  ];
  return {
    showIds: selection.showIds.length ? selection.showIds : undefined,
    extraIds: selection.extraIds.length ? selection.extraIds : undefined,
    snackId: selection.snackId || undefined,
    cajitasCantidad: selection.cajitasCantidad,
    piqueos: selection.piqueoIds.length
      ? selection.piqueoIds.map((id) => ({
          productoId: id,
          cantidad: Math.max(selection.piqueosCantidades[id] ?? 1, 1),
        }))
      : undefined,
    adicionales: adicionales.length ? adicionales : undefined,
  };
}
