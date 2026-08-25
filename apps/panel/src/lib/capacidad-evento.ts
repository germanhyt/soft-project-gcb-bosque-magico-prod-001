import type { ConfigItem } from './configuracion';

export const CAPACIDAD_EVENTO_DEFAULT = {
  minimo: 10,
  maximoPermitido: 35,
} as const;

export type CapacidadEvento = {
  minimo: number;
  maximoPermitido: number;
};

function num(valor: unknown, fallback: number): number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 1
    ? Math.floor(valor)
    : fallback;
}

export function capacidadEventoDesdeItems(
  items: ConfigItem[] | undefined,
): CapacidadEvento {
  const map = new Map((items ?? []).map((i) => [i.clave, i.valor]));
  const minimo = num(map.get('ninos.minimo'), CAPACIDAD_EVENTO_DEFAULT.minimo);
  const maximo = num(
    map.get('ninos.maximo_permitido'),
    CAPACIDAD_EVENTO_DEFAULT.maximoPermitido,
  );
  return { minimo, maximoPermitido: Math.max(maximo, minimo) };
}

export function mensajeCapacidadMinimo(minimo: number): string {
  return `Mínimo ${minimo} niños`;
}

export function mensajeCapacidadMaximo(maximo: number): string {
  return `Máximo ${maximo} niños en reserva regular — confirma con el equipo si necesitas más`;
}

export function hintCapacidadEvento(capacidad: CapacidadEvento): string {
  return `Capacidad del evento: mínimo ${capacidad.minimo}, máximo ${capacidad.maximoPermitido} niños.`;
}
