import type { ConfigItem } from './configuracion';

/** Fallback solo si la API no devuelve config (desarrollo offline). */
export const PAQUETES_CONFIG_DEFAULT = {
  cajitasIncluidas: 10,
  cajitasPrecioExcedente: 20.9,
  piqueosCreditoPremium: 200,
} as const;

export type PaquetesConfig = {
  cajitasIncluidas: number;
  cajitasPrecioExcedente: number;
  piqueosCreditoPremium: number;
};

function num(valor: unknown, fallback: number): number {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : fallback;
}

export function paquetesConfigDesdeItems(items: ConfigItem[] | undefined): PaquetesConfig {
  const map = new Map((items ?? []).map((i) => [i.clave, i.valor]));
  return {
    cajitasIncluidas: num(
      map.get('paquetes.cajitas_incluidas'),
      PAQUETES_CONFIG_DEFAULT.cajitasIncluidas,
    ),
    cajitasPrecioExcedente: num(
      map.get('paquetes.cajitas_precio_excedente'),
      PAQUETES_CONFIG_DEFAULT.cajitasPrecioExcedente,
    ),
    piqueosCreditoPremium: num(
      map.get('paquetes.piqueos_credito_premium'),
      PAQUETES_CONFIG_DEFAULT.piqueosCreditoPremium,
    ),
  };
}
