import type { EtapaSolicitud } from './api';
import type { EtapaCotizacion } from './cotizaciones';
import type { EtapaContrato } from './contratos';

/**
 * Máquina de estados — Solicitud (lead)
 *
 * nueva → en_atencion (tomar) → cotizada (crear/enviar cotización) → cerrada
 *   └─ cerrada directa (motivo: perdida, duplicada, etc.)
 * Al aceptar cotización vinculada → cerrada con motivo ganada (API sync).
 */
export const TRANSICIONES_SOLICITUD = {
  nueva: ['en_atencion', 'cerrada'] as const,
  en_atencion: ['cotizada', 'cerrada'] as const,
  cotizada: ['cerrada'] as const,
  cerrada: [] as const,
} satisfies Record<EtapaSolicitud, readonly EtapaSolicitud[]>;

/**
 * Máquina de estados — Cotización
 *
 * borrador → enviada (WhatsApp/correo) → aceptada (cliente o equipo) → evento en agenda
 * borrador | enviada → cerrada (al cerrar solicitud o manual)
 */
export const TRANSICIONES_COTIZACION = {
  borrador: ['enviada', 'cerrada'] as const,
  enviada: ['aceptada', 'cerrada'] as const,
  aceptada: [] as const,
  cerrada: [] as const,
} satisfies Record<EtapaCotizacion, readonly EtapaCotizacion[]>;

export function puedeTomarSolicitud(etapa: EtapaSolicitud): boolean {
  return etapa === 'nueva';
}

export function solicitudAbierta(etapa: EtapaSolicitud): boolean {
  return etapa !== 'cerrada';
}

export function puedeEnviarCotizacion(etapa: EtapaCotizacion): boolean {
  return etapa === 'borrador' || etapa === 'enviada';
}

export function puedeAceptarCotizacion(etapa: EtapaCotizacion): boolean {
  return etapa === 'enviada';
}

export function puedeEditarCotizacionBorrador(etapa: EtapaCotizacion): boolean {
  return etapa === 'borrador';
}

export function puedeGenerarContrato(etapa: EtapaCotizacion): boolean {
  return etapa === 'aceptada';
}

export function puedeEnviarContrato(etapa: EtapaContrato): boolean {
  return etapa === 'borrador' || etapa === 'enviado';
}

export function puedeMarcarContratoFirmado(etapa: EtapaContrato): boolean {
  return etapa === 'borrador' || etapa === 'enviado';
}
