/** Plantillas de correo para envío de cotización (alineadas con API). */

export function asuntoCorreoCotizacion(codigo: string): string {
  return `Cotización ${codigo} - Bosque Mágico`;
}

export function mensajeCorreoCotizacion(
  nombreCompleto: string,
  codigo: string,
  linkPublico: string,
  linkPdfPublico?: string,
): string {
  const pdfBlock = linkPdfPublico ? `\nDescargar PDF:\n${linkPdfPublico}\n` : '';
  return (
    `Hola ${nombreCompleto},\n\n` +
    `Tu cotización Bosque Mágico (${codigo}) está lista.\n\n` +
    `Ver detalle y aceptar:\n${linkPublico}\n` +
    pdfBlock +
    `\nSaludos cordiales,\nEquipo Bosque Mágico`
  );
}
