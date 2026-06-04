import type { QuoteBuilderSelection } from '../types/quote-builder';
import type { SelectionMode } from './selection-mode';

type IdField = 'showIds' | 'cateringIds' | 'extraIds';
type QtyField = 'showCantidades' | 'cateringCantidades' | 'extraCantidades';

export function toggleCatalogSelection(
  prev: QuoteBuilderSelection,
  idsField: IdField,
  qtyField: QtyField,
  productId: string,
  checked: boolean,
  mode: SelectionMode,
  defaultQty: number,
): QuoteBuilderSelection {
  if (mode === 'single') {
    if (!checked) {
      return { ...prev, [idsField]: [], [qtyField]: {} };
    }
    return {
      ...prev,
      [idsField]: [productId],
      [qtyField]: { [productId]: defaultQty },
    };
  }

  const nextIds = checked
    ? [...prev[idsField], productId]
    : prev[idsField].filter((id) => id !== productId);
  const nextCantidades = { ...prev[qtyField] };
  if (checked) nextCantidades[productId] = nextCantidades[productId] ?? defaultQty;
  if (!checked) delete nextCantidades[productId];
  return { ...prev, [idsField]: nextIds, [qtyField]: nextCantidades };
}
