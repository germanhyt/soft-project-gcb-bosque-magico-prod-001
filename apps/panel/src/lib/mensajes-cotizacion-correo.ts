/** Plantillas de correo para envío de cotización (alineadas con API). */

export function asuntoCorreoCotizacion(codigo: string): string {
  return `Cotización ${codigo} - Bosque Mágico`;
}

export function mensajeCorreoCotizacion(
  nombreCompleto: string,
  codigo: string,
  linkPublico: string,
): string {
  return (
    `Hola ${nombreCompleto},\n\n` +
    `Tu cotización Bosque Mágico (${codigo}) está lista.\n\n` +
    `Ver detalle y aceptar:\n${linkPublico}\n\n` +
    `Saludos cordiales,\nEquipo Bosque Mágico`
  );
}
