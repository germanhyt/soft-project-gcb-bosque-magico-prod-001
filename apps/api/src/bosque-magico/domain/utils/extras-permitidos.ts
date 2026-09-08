/**
 * Copia operativa para Nest (CJS).
 * No importar @bosque/shared aquí: ese paquete es ESM/TS y Node no lo resuelve en dist/.
 * La fuente de print/UI sigue en packages/shared.
 */
const CODIGOS_EXTRA_PERMITIDO_DEFAULT = ['EXT-PINATA', 'EXT-TORTA'] as const;
const CONTRATO_EXTRAS_PERMITIDOS = ['Piñata', 'Torta temática'] as const;
const MAX_EXTRAS_PERMITIDOS = 20;
const MAX_NOMBRE_EXTRA = 80;

export type ProductoExtraPermitidoRef = {
  extraPermitido?: boolean | null;
  codigo?: string | null;
  nombre: string;
  etapa?: string | null;
};

export function esProductoExtraPermitido(producto: {
  extraPermitido?: boolean | null;
  codigo?: string | null;
}): boolean {
  if (producto.extraPermitido) return true;
  const codigo = producto.codigo?.trim().toUpperCase();
  return (
    !!codigo &&
    (CODIGOS_EXTRA_PERMITIDO_DEFAULT as readonly string[]).includes(codigo)
  );
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
    out.push(nombre.slice(0, MAX_NOMBRE_EXTRA));
    if (out.length >= MAX_EXTRAS_PERMITIDOS) break;
  }
  return out;
}

export function nombresExtrasPermitidosDesdeCatalogo(
  productos?: readonly ProductoExtraPermitidoRef[] | null,
): string[] {
  const fromCatalog = (productos ?? [])
    .filter((p) => esProductoExtraPermitido(p) && p.etapa !== 'inactivo')
    .map((p) => p.nombre);
  const normalizados = normalizarExtrasPermitidos(fromCatalog);
  return normalizados.length > 0 ? normalizados : [...CONTRATO_EXTRAS_PERMITIDOS];
}

export function parseExtrasPermitidosJson(value: unknown): string[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  return normalizarExtrasPermitidos(
    value.filter((item): item is string => typeof item === 'string'),
  );
}
