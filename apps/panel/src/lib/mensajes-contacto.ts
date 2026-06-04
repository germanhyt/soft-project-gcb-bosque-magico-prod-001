/** Plantillas de mensaje para contacto desde el panel (clientes). */

export function primerNombre(nombreCompleto: string): string {
  const parte = nombreCompleto.trim().split(/\s+/)[0];
  return parte || nombreCompleto;
}

export function mensajeWhatsAppCliente(nombreCompleto: string): string {
  const nombre = primerNombre(nombreCompleto);
  return `Hola ${nombre}, te escribimos desde Bosque Mágico para saludarte y ver si podemos ayudarte con la celebración de tu pequeño o escuchar tu próxima visita.`;
}

export function asuntoCorreoCliente(): string {
  return 'Bosque Mágico · Estamos para ayudarte';
}

export function mensajeCorreoCliente(nombreCompleto: string): string {
  const nombre = primerNombre(nombreCompleto);
  return `Hola ${nombre}, te escribimos desde Bosque Mágico para saludarte y ver si podemos ayudarte con la celebración de tu pequeño o escuchar tu próxima visita.

Saludos cordiales,
Equipo Bosque Mágico`;
}
