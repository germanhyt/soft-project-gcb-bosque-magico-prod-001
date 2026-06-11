import type { ConfiguracionItem } from './api';

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

export function calcularEstimado(
  tarifas: TarifasConfig,
  fecha: string,
  cantidadNinos: number,
  feriados: readonly string[] = [],
): { base: number; extraNinos: number; total: number; esFinSemana: boolean; advertencia?: string } {
  let advertencia: string | undefined;
  if (cantidadNinos > tarifas.maximoPermitido) {
    advertencia = `Más de ${tarifas.maximoPermitido} niños requiere confirmación con el equipo.`;
  }
  const esFinSemana = isWeekend(fecha, feriados);
  const base = esFinSemana ? tarifas.baseFinSemana : tarifas.baseLunesViernes;
  const extraCount = Math.max(Math.min(cantidadNinos, tarifas.maximoPermitido) - tarifas.maximoBase, 0);
  const extraNinos = extraCount * tarifas.precioNinoExtra;
  return { base, extraNinos, total: base + extraNinos, esFinSemana, advertencia };
}

export function formatSoles(amount: number) {
  return `S/ ${amount.toFixed(2)}`;
}
