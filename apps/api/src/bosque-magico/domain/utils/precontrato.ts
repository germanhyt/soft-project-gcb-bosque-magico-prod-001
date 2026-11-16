import { CONTRATO_TERMINOS_VERSION } from '../constants/contrato.constants';

export type PrecontratoGuardado = {
  adelanto1Monto: number;
  adelanto1Fecha: string;
  adelanto2Monto: number;
  adelanto2Fecha: string;
  montoGarantia: number;
  terminosVersion: string;
  generadoEn: string;
};

const GARANTIA_DEFECTO = 500;

function montoNoNegativo(value: number | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, value) * 100) / 100;
}

/** El precontrato se entrega mientras la cotización sigue abierta. */
export function puedeEntregarPrecontrato(etapa: string): boolean {
  return etapa === 'borrador' || etapa === 'enviada';
}

/** El adelanto no supera el total ya cotizado. */
export function resolverAdelantoPrecontrato(
  montoTotal: number,
  solicitado: number,
): number {
  if (!Number.isFinite(montoTotal) || !Number.isFinite(solicitado)) return 0;
  const total = Math.max(0, montoTotal);
  const monto = Math.max(0, solicitado);
  return Math.round(Math.min(monto, total) * 100) / 100;
}

/** La suma de los dos adelantos no puede pasar el total cotizado. */
export function adelantosExcedenTotal(
  montoTotal: number,
  adelanto1: number,
  adelanto2: number,
): boolean {
  if (!Number.isFinite(montoTotal)) return true;
  const total = Math.round(Math.max(0, montoTotal) * 100);
  const suma = Math.round((adelanto1 + adelanto2) * 100);
  return suma > total;
}

export function armarPrecontrato(input: {
  montoTotal: number;
  adelanto1Monto: number;
  adelanto1Fecha: string;
  adelanto2Monto?: number;
  adelanto2Fecha?: string;
  montoGarantia?: number;
  generadoEn: string;
}): PrecontratoGuardado {
  const adelanto2Monto = montoNoNegativo(input.adelanto2Monto);
  const garantia =
    input.montoGarantia == null || !Number.isFinite(input.montoGarantia)
      ? GARANTIA_DEFECTO
      : Math.round(Math.max(0, input.montoGarantia) * 100) / 100;
  return {
    adelanto1Monto: resolverAdelantoPrecontrato(
      input.montoTotal,
      input.adelanto1Monto,
    ),
    adelanto1Fecha: input.adelanto1Fecha,
    adelanto2Monto,
    adelanto2Fecha: adelanto2Monto > 0 ? (input.adelanto2Fecha ?? '') : '',
    montoGarantia: garantia,
    terminosVersion: CONTRATO_TERMINOS_VERSION,
    generadoEn: input.generadoEn,
  };
}

export function parsePrecontrato(value: unknown): PrecontratoGuardado | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const monto = Number(raw.adelanto1Monto);
  const fecha = typeof raw.adelanto1Fecha === 'string' ? raw.adelanto1Fecha : '';
  if (!Number.isFinite(monto) || monto <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }
  const adelanto2 = montoNoNegativo(
    typeof raw.adelanto2Monto === 'number' ? raw.adelanto2Monto : Number(raw.adelanto2Monto),
  );
  const fecha2 = typeof raw.adelanto2Fecha === 'string' ? raw.adelanto2Fecha : '';
  const segundoValido = adelanto2 > 0 && /^\d{4}-\d{2}-\d{2}$/.test(fecha2);
  const garantiaRaw = Number(raw.montoGarantia);
  return {
    adelanto1Monto: monto,
    adelanto1Fecha: fecha,
    adelanto2Monto: segundoValido ? adelanto2 : 0,
    adelanto2Fecha: segundoValido ? fecha2 : '',
    montoGarantia:
      Number.isFinite(garantiaRaw) && garantiaRaw >= 0
        ? Math.round(garantiaRaw * 100) / 100
        : GARANTIA_DEFECTO,
    terminosVersion:
      typeof raw.terminosVersion === 'string'
        ? raw.terminosVersion
        : CONTRATO_TERMINOS_VERSION,
    generadoEn: typeof raw.generadoEn === 'string' ? raw.generadoEn : '',
  };
}
