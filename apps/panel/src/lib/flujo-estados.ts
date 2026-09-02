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
  enviada: ['aceptada', 'cerrada', 'borrador'] as const,
  aceptada: [] as const,
  cerrada: [] as const,
} satisfies Record<EtapaCotizacion, readonly EtapaCotizacion[]>;

/**
 * Máquina de estados — Contrato
 *
 * borrador → enviado (WhatsApp/correo) → firmado
 * enviado → borrador (corregir; no si el evento ya está confirmado/realizado/cancelado)
 * firmado no revierte
 */
export const TRANSICIONES_CONTRATO = {
  borrador: ['enviado', 'firmado'] as const,
  enviado: ['firmado', 'borrador'] as const,
  firmado: [] as const,
  anulado: [] as const,
} satisfies Record<EtapaContrato, readonly EtapaContrato[]>;

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

export function puedeVolverABorradorCotizacion(etapa: EtapaCotizacion): boolean {
  return etapa === 'enviada';
}

/** Cerrar el lead desde una cotización abierta (no aceptada ni ya cerrada). */
export function puedeCerrarSolicitudDesdeCotizacion(
  etapaCotizacion: EtapaCotizacion,
  solicitudId?: string | null,
  etapaSolicitud?: string | null,
): boolean {
  if (!solicitudId) return false;
  if (etapaSolicitud === 'cerrada') return false;
  return etapaCotizacion === 'borrador' || etapaCotizacion === 'enviada';
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

export function puedeVolverABorradorContrato(
  etapa: EtapaContrato,
  eventoEtapa?: string | null,
): boolean {
  return (
    etapa === 'enviado' &&
    eventoEtapa !== 'confirmado' &&
    eventoEtapa !== 'realizado' &&
    eventoEtapa !== 'cancelado'
  );
}

/** Texto para mostrar el botón deshabilitado (contrato enviado pero el evento ya cerró el flujo). */
export function motivoBloqueoVolverABorradorContrato(
  etapa: EtapaContrato,
  eventoEtapa?: string | null,
): string | null {
  if (etapa !== 'enviado') return null;
  if (eventoEtapa === 'confirmado') {
    return 'No se puede volver a borrador: el evento ya está confirmado.';
  }
  if (eventoEtapa === 'realizado') {
    return 'No se puede volver a borrador: el evento ya está realizado.';
  }
  if (eventoEtapa === 'cancelado') {
    return 'No se puede volver a borrador: el evento está cancelado.';
  }
  return null;
}
