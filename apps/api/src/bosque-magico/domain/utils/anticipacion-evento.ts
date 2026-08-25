import { BadRequestException } from '@nestjs/common';
import {
  claveFechaCalendario,
  esFechaCalendario,
  fechaCalendarioHoy,
  formatFechaDdMmYyyy,
} from './fecha-calendario';

export const CLAVE_MIN_DIAS_ANTICIPACION = 'solicitud.min_dias_anticipacion';
export const MIN_DIAS_ANTICIPACION_DEFAULT = 7;

export function minDiasAnticipacionDesdeConfig(valor: unknown): number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 0) {
    return MIN_DIAS_ANTICIPACION_DEFAULT;
  }
  return Math.floor(valor);
}

/** Fecha mínima permitida (YYYY-MM-DD) contando desde hoy en zona Perú. */
export function fechaMinimaEvento(minDias: number): string {
  const hoy = fechaCalendarioHoy();
  const [y, m, d] = hoy.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  base.setUTCDate(base.getUTCDate() + minDias);
  return claveFechaCalendario(base);
}

function diasEntre(fechaDesde: string, fechaHasta: string): number {
  const [y1, m1, d1] = fechaDesde.split('-').map(Number);
  const [y2, m2, d2] = fechaHasta.split('-').map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/**
 * Valida que la fecha de evento cumpla la anticipación mínima.
 * @throws BadRequestException si la fecha es anterior al mínimo permitido
 */
export function validarAnticipacionEvento(
  fechaInput: string | Date,
  minDias: number,
): void {
  const clave = claveFechaCalendario(fechaInput);
  if (!esFechaCalendario(clave)) {
    throw new BadRequestException('Fecha de evento inválida');
  }
  const minima = fechaMinimaEvento(minDias);
  if (clave < minima) {
    const dias = diasEntre(fechaCalendarioHoy(), clave);
    const textoDias =
      minDias === 1 ? '1 día' : minDias === 7 ? '1 semana' : `${minDias} días`;
    throw new BadRequestException(
      dias < 0
        ? 'La fecha del evento no puede ser anterior a hoy'
        : `Se requiere al menos ${textoDias} de anticipación. Fecha mínima: ${formatFechaDdMmYyyy(minima)}.`,
    );
  }
}
