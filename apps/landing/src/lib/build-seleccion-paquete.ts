import type { QuoteBuilderSelection } from '../types/quote-builder';
import type { ProductoCatalogo, SeleccionPaquetePayload } from './api';
import { minimoUnidadesCatering } from './catering-minimo';
import { expandIdsFromQty } from './expand-catalog-qty';

export type BuildSeleccionPaqueteOptions = {
  cateringCatalog?: readonly ProductoCatalogo[];
  minimoCateringGlobal?: number;
};

export function buildSeleccionPaquete(
  selection: QuoteBuilderSelection,
  options?: BuildSeleccionPaqueteOptions,
): SeleccionPaquetePayload {
  const showIds = expandIdsFromQty(selection.showIds, selection.showCantidades);
  const extraIds = expandIdsFromQty(selection.extraIds, selection.extraCantidades);
  const minGlobal = options?.minimoCateringGlobal;
  const adicionales = selection.cateringIds.map((id) => {
    const producto = options?.cateringCatalog?.find((p) => p.id === id);
    const min = minimoUnidadesCatering(producto, minGlobal);
    const cantidad = Math.max(selection.cateringCantidades[id] ?? min, min);
    return { productoId: id, cantidad };
  });
  return {
    showIds: showIds.length ? showIds : undefined,
    extraIds: extraIds.length ? extraIds : undefined,
    snackId: selection.snackId || undefined,
    snackCantidad: selection.snackId
      ? Math.max(selection.snackCantidad ?? 25, 25)
      : undefined,
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
