import type { ConfiguracionItem } from './api';

export const PAQUETES_CONFIG_DEFAULT = {
  cajitasIncluidas: 10,
  cajitasPrecioExcedente: 20.9,
  piqueosCreditoPremium: 200,
  snackPremiumUnidadesIncluidas: 25,
  snackPremiumPrecioExcedente: 10,
} as const;

function num(valor: unknown, fallback: number): number {
  return typeof valor === 'number' && !Number.isNaN(valor) ? valor : fallback;
}

export function paquetesConfigDesdeItems(items: ConfiguracionItem[] | undefined) {
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
    snackPremiumUnidadesIncluidas: num(
      map.get('paquetes.snack_premium_unidades_incluidas'),
      PAQUETES_CONFIG_DEFAULT.snackPremiumUnidadesIncluidas,
    ),
    snackPremiumPrecioExcedente: num(
      map.get('paquetes.snack_premium_precio_excedente'),
      PAQUETES_CONFIG_DEFAULT.snackPremiumPrecioExcedente,
    ),
  };
}
