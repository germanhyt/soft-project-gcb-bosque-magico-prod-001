/** Preserva el orden de primera aparición de cada id. */
export function uniqueIdsPreservingOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  return order;
}

/** Expande ids según cantidades; si no hay cantidad explícita, usa repeticiones en ids. */
export function expandIdsFromQty(
  ids: readonly string[],
  cantidades: Record<string, number>,
): string[] {
  if (!ids.length) return [];
  return uniqueIdsPreservingOrder(ids).flatMap((id) => {
    const qty = cantidades[id] ?? ids.filter((x) => x === id).length;
    return Array(Math.max(qty, 1)).fill(id);
  });
}
