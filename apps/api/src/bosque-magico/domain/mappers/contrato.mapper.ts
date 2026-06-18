import { fromDecimal } from '../utils/decimal';

export function mapContratoResponse(contrato: Record<string, unknown>) {
  const tokenPublico = String(contrato.tokenPublico ?? '');
  return {
    ...contrato,
    linkPublico: tokenPublico ? `/contrato/${tokenPublico}` : '',
    linkPdfPublico: tokenPublico ? `/contrato/${tokenPublico}/pdf` : '',
    montoTotal: fromDecimal(contrato.montoTotal as never),
    montoAdelanto: fromDecimal(contrato.montoAdelanto as never),
    montoPendiente: fromDecimal(contrato.montoPendiente as never),
    montoGarantia: fromDecimal(contrato.montoGarantia as never),
    adelanto1Monto: fromDecimal(contrato.adelanto1Monto as never),
    adelanto2Monto:
      contrato.adelanto2Monto != null
        ? fromDecimal(contrato.adelanto2Monto as never)
        : null,
    fechaEmision:
      contrato.fechaEmision instanceof Date
        ? contrato.fechaEmision.toISOString().slice(0, 10)
        : contrato.fechaEmision,
    adelanto1Fecha:
      contrato.adelanto1Fecha instanceof Date
        ? contrato.adelanto1Fecha.toISOString().slice(0, 10)
        : contrato.adelanto1Fecha,
    adelanto2Fecha:
      contrato.adelanto2Fecha instanceof Date
        ? contrato.adelanto2Fecha.toISOString().slice(0, 10)
        : contrato.adelanto2Fecha,
  };
}
