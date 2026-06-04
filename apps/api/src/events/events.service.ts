import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import type {
  BosquePanelEvent,
  BosquePanelEventType,
} from './panel-event.types';

@Injectable()
export class EventsService {
  constructor(private readonly gateway: EventsGateway) {}

  private emit(
    type: BosquePanelEventType,
    titulo: string,
    mensaje: string,
    entidad?: { tipo: string; id: string },
  ) {
    const event: BosquePanelEvent = {
      type,
      titulo,
      mensaje,
      entidad,
      creadoEn: new Date().toISOString(),
    };
    this.gateway.emitPanelEvent(event);
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
