import {
  linkPdfPublicoContratoCompleto,
  linkPublicoContratoCompleto,
} from './contratos';

export function asuntoCorreoContrato(
  numeroContrato: string,
  etapa?: 'borrador' | 'enviado' | 'firmado' | 'anulado',
): string {
  if (etapa === 'firmado') {
    return `Contrato firmado ${numeroContrato} - Bosque Mágico`;
  }
  return `Contrato ${numeroContrato} - Bosque Mágico`;
}

export function mensajeCorreoContrato(
  nombreCompleto: string,
  numeroContrato: string,
  tokenOLinkPublico: string,
  tokenOLinkPdf: string,
  etapa?: 'borrador' | 'enviado' | 'firmado' | 'anulado',
): string {
  const linkPublico = linkPublicoContratoCompleto(tokenOLinkPublico);
  const linkPdf = linkPdfPublicoContratoCompleto(tokenOLinkPdf);
  const intro =
    etapa === 'firmado'
      ? `Te compartimos el contrato firmado ${numeroContrato} de Bosque Mágico.`
      : `Te compartimos el contrato ${numeroContrato} de Bosque Mágico.`;
  return (
    `Hola ${nombreCompleto},\n\n` +
    `${intro}\n\n` +
    `Ver resumen en línea:\n${linkPublico}\n\n` +
    `Descargar PDF:\n${linkPdf}\n\n` +
    `Saludos cordiales,\nEquipo Bosque Mágico`
  );
}
