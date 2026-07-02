import {
  linkPdfPublicoContratoCompleto,
  linkPublicoContratoCompleto,
} from './contratos';

export function asuntoCorreoContrato(numeroContrato: string): string {
  return `Contrato ${numeroContrato} - Bosque Mágico`;
}

export function mensajeCorreoContrato(
  nombreCompleto: string,
  numeroContrato: string,
  tokenOLinkPublico: string,
  tokenOLinkPdf: string,
): string {
  const linkPublico = linkPublicoContratoCompleto(tokenOLinkPublico);
  const linkPdf = linkPdfPublicoContratoCompleto(tokenOLinkPdf);
  return (
    `Hola ${nombreCompleto},\n\n` +
    `Te compartimos el contrato ${numeroContrato} de Bosque Mágico.\n\n` +
    `Ver resumen en línea:\n${linkPublico}\n\n` +
    `Descargar PDF:\n${linkPdf}\n\n` +
    `Saludos cordiales,\nEquipo Bosque Mágico`
  );
}
