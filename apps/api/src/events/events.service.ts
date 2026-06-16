import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { PanelNotificacionesRepository } from './panel-notificaciones.repository';
import type {
  BosquePanelEvent,
  BosquePanelEventType,
} from './panel-event.types';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly gateway: EventsGateway,
    private readonly panelNotificaciones: PanelNotificacionesRepository,
  ) {}

  private emit(
    type: BosquePanelEventType,
    titulo: string,
    mensaje: string,
    entidad?: { tipo: string; id: string },
  ) {
    void this.persistAndEmit(type, titulo, mensaje, entidad);
  }

  private async persistAndEmit(
    type: BosquePanelEventType,
    titulo: string,
    mensaje: string,
    entidad?: { tipo: string; id: string },
  ) {
    try {
      const event = await this.panelNotificaciones.crear({
        type,
        titulo,
        mensaje,
        entidad,
      });
      this.gateway.emitPanelEvent(event);
    } catch (err) {
      this.logger.error('No se pudo persistir notificación de panel', err);
      const fallback: BosquePanelEvent = {
        id: `tmp-${Date.now()}`,
        type,
        titulo,
        mensaje,
        entidad,
        creadoEn: new Date().toISOString(),
      };
      this.gateway.emitPanelEvent(fallback);
    }
  }

  solicitudNueva(id: string, nombreContacto: string) {
    this.emit(
      'solicitud.nueva',
      'Nueva solicitud',
      `${nombreContacto} ingresó desde la landing`,
      { tipo: 'solicitud', id },
    );
  }

  cotizacionBorradorLista(
    solicitudId: string,
    cotizacionId: string,
    codigo: string,
    nombreContacto: string,
  ) {
    this.emit(
      'cotizacion.borrador',
      'Cotización lista para revisar',
      `${nombreContacto} — ${codigo}. Borrador desde landing.`,
      { tipo: 'cotizacion', id: cotizacionId },
    );
    this.emit(
      'solicitud.actualizada',
      'Solicitud actualizada',
      'Cotización borrador generada',
      {
        tipo: 'solicitud',
        id: solicitudId,
      },
    );
  }

  solicitudActualizada(id: string, detalle: string) {
    this.emit('solicitud.actualizada', 'Solicitud actualizada', detalle, {
      tipo: 'solicitud',
      id,
    });
  }

  cotizacionActualizada(id: string, codigo: string, detalle: string) {
    this.emit('cotizacion.actualizada', `Cotización ${codigo}`, detalle, {
      tipo: 'cotizacion',
      id,
    });
  }

  cotizacionAceptada(id: string, codigo: string) {
    this.emit('cotizacion.aceptada', 'Cotización aceptada', codigo, {
      tipo: 'cotizacion',
      id,
    });
  }

  eventoActualizado(id: string, detalle: string) {
    this.emit('evento.actualizado', 'Agenda actualizada', detalle, {
      tipo: 'evento',
      id,
    });
  }
}
