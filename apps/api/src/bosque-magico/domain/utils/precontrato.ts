import { CONTRATO_TERMINOS_VERSION } from '../constants/contrato.constants';

export type PrecontratoGuardado = {
  adelanto1Monto: number;
  adelanto1Fecha: string;
  terminosVersion: string;
  generadoEn: string;
};

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

export function armarPrecontrato(input: {
  montoTotal: number;
  adelanto1Monto: number;
  adelanto1Fecha: string;
  generadoEn: string;
}): PrecontratoGuardado {
  return {
    adelanto1Monto: resolverAdelantoPrecontrato(
      input.montoTotal,
      input.adelanto1Monto,
    ),
    adelanto1Fecha: input.adelanto1Fecha,
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
  return {
    adelanto1Monto: monto,
    adelanto1Fecha: fecha,
    terminosVersion:
      typeof raw.terminosVersion === 'string'
        ? raw.terminosVersion
        : CONTRATO_TERMINOS_VERSION,
    generadoEn: typeof raw.generadoEn === 'string' ? raw.generadoEn : '',
  };
}
