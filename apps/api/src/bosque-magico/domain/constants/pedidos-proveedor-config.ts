export const CLAVE_PEDIDOS_NOTIFICAR_CORREO =
  'pedidos_proveedor.notificar_correo';
export const CLAVE_PEDIDOS_NOTIFICAR_NEGOCIACION =
  'pedidos_proveedor.notificar_negociacion';
export const CLAVE_PEDIDOS_NEGOCIACION_ASUNTO =
  'pedidos_proveedor.negociacion_asunto';
export const CLAVE_PEDIDOS_NEGOCIACION_CUERPO =
  'pedidos_proveedor.negociacion_cuerpo';

export const DEFAULT_NEGOCIACION_ASUNTO =
  'Consulta de disponibilidad — {{servicio}} ({{fecha}})';

export const DEFAULT_NEGOCIACION_CUERPO = [
  'Hola {{proveedor}},',
  '',
  'El cliente aceptó una cotización en Bosque Mágico. Antes de firmar el contrato queremos confirmar tu disponibilidad y el costo estimado.',
  '',
  'Cliente: {{cliente}}',
  'Evento: {{fecha}} · {{turno}}',
  'Cumpleañero: {{edad}} años',
  'Niños: {{cantidadNinos}}',
  'Temática: {{tematica}}',
  'Servicio: {{servicio}}',
  'Cantidad: {{cantidad}}',
  'Costo referencial: S/ {{costo}}',
  '{{notas}}',
  '',
  'Confirma o rechaza desde este enlace (puedes comentar tu costo):',
  '{{link}}',
  '',
  'Gracias.',
  'Equipo Bosque Mágico',
].join('\n');

/** Ausente o distinto de false = habilitado (default ON). */
export function negociacionCorreoHabilitado(valor: unknown): boolean {
  return valor !== false;
}
