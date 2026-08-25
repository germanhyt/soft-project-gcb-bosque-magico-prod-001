import { BadRequestException } from '@nestjs/common';

export const CLAVE_NINOS_MINIMO = 'ninos.minimo';
export const CLAVE_NINOS_MAXIMO_PERMITIDO = 'ninos.maximo_permitido';
export const NINOS_MINIMO_DEFAULT = 10;
export const NINOS_MAXIMO_PERMITIDO_DEFAULT = 35;

export function ninosMinimoDesdeConfig(valor: unknown): number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 1) {
    return NINOS_MINIMO_DEFAULT;
  }
  return Math.floor(valor);
}

export function ninosMaximoDesdeConfig(valor: unknown): number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 1) {
    return NINOS_MAXIMO_PERMITIDO_DEFAULT;
  }
  return Math.floor(valor);
}

export function mensajeCapacidadMinimo(minimo: number): string {
  return `Mínimo ${minimo} niños`;
}

export function mensajeCapacidadMaximo(maximo: number): string {
  return `Máximo ${maximo} niños en reserva regular. Para más, confirma con el equipo.`;
}

/**
 * Valida cantidad de niños contra Capacidad del evento (config).
 * @throws BadRequestException
 */
export function validarCapacidadEvento(
  cantidad: number | null | undefined,
  minimo: number,
  maximo: number,
): void {
  if (cantidad == null) return;
  if (!Number.isInteger(cantidad)) {
    throw new BadRequestException('Indica un número válido de niños');
  }
  if (cantidad < minimo) {
    throw new BadRequestException(mensajeCapacidadMinimo(minimo));
  }
  if (cantidad > maximo) {
    throw new BadRequestException(mensajeCapacidadMaximo(maximo));
  }
}
