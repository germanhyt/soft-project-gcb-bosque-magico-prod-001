import type { ConfiguracionItem, ProductoCatalogo } from './api';

export type TarifasConfig = {
  baseLunesViernes: number;
  baseFinSemana: number;
  precioNinoExtra: number;
  minimoNinos: number;
  maximoBase: number;
  maximoPermitido: number;
  adelanto: number;
  garantia: number;
};

export const TARIFAS_DEFAULT: TarifasConfig = {
  baseLunesViernes: 380,
  baseFinSemana: 580,
  precioNinoExtra: 25,
  minimoNinos: 10,
  maximoBase: 25,
  maximoPermitido: 35,
  adelanto: 500,
  garantia: 500,
};

function num(valor: unknown, fallback: number): number {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : fallback;
}

export function mapConfigToTarifas(items: ConfiguracionItem[]): TarifasConfig {
  const map = new Map(items.map((i) => [i.clave, i.valor]));
  return {
    baseLunesViernes: num(map.get('tarifas.base_lunes_viernes'), TARIFAS_DEFAULT.baseLunesViernes),
    baseFinSemana: num(map.get('tarifas.base_fin_semana'), TARIFAS_DEFAULT.baseFinSemana),
    precioNinoExtra: num(map.get('tarifas.precio_nino_extra'), TARIFAS_DEFAULT.precioNinoExtra),
    minimoNinos: num(map.get('ninos.minimo'), TARIFAS_DEFAULT.minimoNinos),
    maximoBase: num(map.get('ninos.maximo_base'), TARIFAS_DEFAULT.maximoBase),
    maximoPermitido: num(map.get('ninos.maximo_permitido'), TARIFAS_DEFAULT.maximoPermitido),
    adelanto: num(map.get('contrato.adelanto_referencial'), TARIFAS_DEFAULT.adelanto),
    garantia: num(map.get('contrato.garantia_referencial'), TARIFAS_DEFAULT.garantia),
  };
}

export function feriadosDesdeConfig(items: ConfiguracionItem[]): string[] {
  const raw = items.find((i) => i.clave === 'calendario.feriados')?.valor;
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

export function isWeekend(dateStr: string, feriados: readonly string[] = []): boolean {
  if (!dateStr) return false;
  const clave = dateStr.slice(0, 10);
  if (feriados.includes(clave)) return true;
  const day = new Date(`${clave}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

export const PRECIOS_PAQUETE_FALLBACK: Record<string, { lv: number; fds: number }> = {
  basico: { lv: 380, fds: 580 },
  estandar: { lv: 480, fds: 680 },
  premium: { lv: 580, fds: 780 },
};

function normalizarNombrePaquete(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function preciosPaqueteFallback(nombrePaquete: string): { lv: number; fds: number } {
  const key = normalizarNombrePaquete(nombrePaquete);
  if (key.includes('premium')) return PRECIOS_PAQUETE_FALLBACK.premium;
  if (key.includes('estandar') || key.includes('standard')) return PRECIOS_PAQUETE_FALLBACK.estandar;
  return PRECIOS_PAQUETE_FALLBACK.basico;
}

export function precioPaqueteDesdeCatalogo(
  paquetes: readonly ProductoCatalogo[] | undefined,
  nombrePaquete: string,
  esFinSemana: boolean,
): number | null {
  if (!paquetes?.length || !nombrePaquete.trim()) return null;
  const target = normalizarNombrePaquete(nombrePaquete);
  const match = paquetes.find((p) => {
    const n = normalizarNombrePaquete(p.nombre);
    return n === target || n.includes(target) || target.includes(n);
  });
  if (!match) return null;
  return esFinSemana ? match.precioFinSemana : match.precioLunesViernes;
}

/** Precio del paquete según catálogo, fallback estático o tarifa global si no hay paquete. */
export function resolverMontoBasePaquete(
  nombrePaquete: string | undefined,
  paquetes: readonly ProductoCatalogo[] | undefined,
  fecha: string,
  feriados: readonly string[],
  tarifas: TarifasConfig,
): number {
  const esFinSemana = isWeekend(fecha, feriados);
  if (nombrePaquete) {
    const fromCatalog = precioPaqueteDesdeCatalogo(paquetes, nombrePaquete, esFinSemana);
    if (fromCatalog != null) return fromCatalog;
    const fb = preciosPaqueteFallback(nombrePaquete);
    return esFinSemana ? fb.fds : fb.lv;
  }
  return esFinSemana ? tarifas.baseFinSemana : tarifas.baseLunesViernes;
}

export function calcularEstimado(
  tarifas: TarifasConfig,
  fecha: string,
  cantidadNinos: number,
  feriados: readonly string[] = [],
  options?: { montoBasePaquete?: number },
): { base: number; extraNinos: number; total: number; esFinSemana: boolean; advertencia?: string } {
  let advertencia: string | undefined;
  if (cantidadNinos > tarifas.maximoPermitido) {
    advertencia = `Más de ${tarifas.maximoPermitido} niños requiere confirmación con el equipo.`;
  }
  const esFinSemana = isWeekend(fecha, feriados);
  const base =
    options?.montoBasePaquete ??
    (esFinSemana ? tarifas.baseFinSemana : tarifas.baseLunesViernes);
  const extraCount = Math.max(Math.min(cantidadNinos, tarifas.maximoPermitido) - tarifas.maximoBase, 0);
  const extraNinos = extraCount * tarifas.precioNinoExtra;
  return { base, extraNinos, total: base + extraNinos, esFinSemana, advertencia };
}

export function formatSoles(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}
