/**
 * Doble de @bosque/shared para Jest.
 * El client ESM del paquete no se transforma (type: module).
 * Jest mapea `@bosque/shared` aquí (ver package.json#jest.moduleNameMapper).
 * La lógica real se cubre en packages/shared/*.spec.ts (Vitest).
 */
export function esProductoExtraPermitido(producto: {
  extraPermitido?: boolean | null;
  codigo?: string | null;
}): boolean {
  if (producto.extraPermitido) return true;
  const codigo = producto.codigo?.trim().toUpperCase();
  return codigo === 'EXT-PINATA' || codigo === 'EXT-TORTA';
}

export function normalizarExtrasPermitidos(lista?: readonly string[] | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lista ?? []) {
    const nombre = raw.trim().replace(/\s+/g, ' ');
    if (!nombre) continue;
    const key = nombre.toLocaleLowerCase('es');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(nombre.slice(0, 80));
    if (out.length >= 20) break;
  }
  return out;
}

export function nombresExtrasPermitidosDesdeCatalogo(
  productos?: readonly {
    extraPermitido?: boolean | null;
    codigo?: string | null;
    nombre: string;
    etapa?: string | null;
  }[] | null,
): string[] {
  const fromCatalog = (productos ?? [])
    .filter((p) => esProductoExtraPermitido(p) && p.etapa !== 'inactivo')
    .map((p) => p.nombre);
  const normalizados = normalizarExtrasPermitidos(fromCatalog);
  return normalizados.length > 0 ? normalizados : ['Piñata', 'Torta temática'];
}

export function parseExtrasPermitidosJson(value: unknown): string[] | null {
  if (value == null || !Array.isArray(value)) return null;
  return normalizarExtrasPermitidos(
    value.filter((item): item is string => typeof item === 'string'),
  );
}
