import {
  CODIGOS_EXTRA_PERMITIDO_DEFAULT,
  CONTRATO_EXTRAS_PERMITIDOS,
} from './contrato-terminos.js';

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

export function nombresIgualesExtraPermitido(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('es') === b.trim().toLocaleLowerCase('es');
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

/** Catálogo con flag extraPermitido; si no hay ninguno, Piñata y Torta temática. */
export function nombresExtrasPermitidosDesdeCatalogo(
  productos?: readonly ProductoExtraPermitidoRef[] | null,
): string[] {
  const fromCatalog = (productos ?? [])
    .filter((p) => esProductoExtraPermitido(p) && p.etapa !== 'inactivo')
    .map((p) => p.nombre);
  const normalizados = normalizarExtrasPermitidos(fromCatalog);
  return normalizados.length > 0 ? normalizados : [...CONTRATO_EXTRAS_PERMITIDOS];
}

/**
 * null/undefined = contrato antiguo → defaults.
 * Array (aunque vacío) = lo que eligió el vendedor.
 */
export function extrasPermitidosParaImpresion(
  lista?: readonly string[] | null,
): string[] {
  if (lista == null) return [...CONTRATO_EXTRAS_PERMITIDOS];
  return normalizarExtrasPermitidos(lista);
}

export function parseExtrasPermitidosJson(value: unknown): string[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  return normalizarExtrasPermitidos(
    value.filter((item): item is string => typeof item === 'string'),
  );
}
