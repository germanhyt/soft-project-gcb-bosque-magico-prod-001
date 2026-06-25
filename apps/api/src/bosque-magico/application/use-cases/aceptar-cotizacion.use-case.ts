import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaCotizacion, Prisma, TurnoInteres } from '@prisma/client';
import {
  mapCotizacionResponse,
  type CotizacionConItems,
} from '../../domain/mappers/cotizacion.mapper';
import { EventsService } from '../../../events/events.service';
import { SolicitudCotizacionSyncService } from '../../domain/services/solicitud-cotizacion-sync.service';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';
import { GenerarPedidosEventoUseCase } from './generar-pedidos-evento.use-case';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';

@Injectable()
export class AceptarCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
    private readonly solicitudSync: SolicitudCotizacionSyncService,
    private readonly anticipacion: AnticipacionEventoService,
    private readonly generarPedidos: GenerarPedidosEventoUseCase,
  ) {}

  async ejecutarPorId(id: string) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    return this.aceptar(cot, 'vendedor');
  }

  async ejecutarPorToken(token: string) {
    const cot = await this.cotizaciones.obtenerPorToken(token);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    return this.aceptar(cot, 'cliente');
  }

  private async aceptar(
    cot: CotizacionConItems & { fechaEvento: Date; turno: TurnoInteres },
    actorTipo: 'vendedor' | 'cliente',
  ) {
    if (cot.etapa === EtapaCotizacion.aceptada) {
      const evento = await this.cotizaciones.crearEventoDesdeCotizacion(cot.id);
      await this.solicitudSync.alAceptarCotizacion(
        (cot as { solicitudId?: string | null }).solicitudId,
      );
      return {
        ...mapCotizacionResponse(cot),
        eventoId: evento.id,
        yaAceptada: true,
      };
    }
    if (cot.etapa !== EtapaCotizacion.enviada) {
      throw new BadRequestException(
        'Solo se pueden aceptar cotizaciones enviadas',
      );
    }

    await this.anticipacion.validar(cot.fechaEvento);

    const conflicto = await this.cotizaciones.existeEventoActivoEnSlot(
      cot.fechaEvento,
      cot.turno,
    );
    if (conflicto) {
      throw new BadRequestException(
        'La fecha y turno ya no están disponibles. Contacta al equipo Bosque Mágico.',
      );
    }

    const despues = await this.cotizaciones.actualizarEtapa(cot.id, {
      etapa: EtapaCotizacion.aceptada,
      aceptadaEn: new Date(),
    });
    const evento = await this.cotizaciones.crearEventoDesdeCotizacion(cot.id);
    await this.generarPedidos.ejecutar(evento.id);

    await this.auditoria.registrar({
      tipoEntidad: 'cotizacion',
      entidadId: cot.id,
      accion: 'aceptar',
      actorTipo,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
      metadata: { eventoId: evento.id },
    });

    const solicitudId = (cot as { solicitudId?: string | null }).solicitudId;
    await this.solicitudSync.alAceptarCotizacion(solicitudId);
    if (solicitudId) {
      this.events.solicitudActualizada(
        solicitudId,
        `Solicitud ganada — ${cot.codigo}`,
      );
    }
    this.events.cotizacionAceptada(cot.id, cot.codigo);

    return {
      ...mapCotizacionResponse(despues),
      eventoId: evento.id,
      mensaje:
        'Cotización aceptada. El equipo confirmará los detalles finales.',
    };
  }
}
