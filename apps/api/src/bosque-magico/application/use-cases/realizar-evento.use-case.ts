import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaEvento, Prisma } from '@prisma/client';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { PostventaService } from '../../domain/services/postventa.service';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

@Injectable()
export class RealizarEventoUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
    private readonly postventa: PostventaService,
  ) {}

  async ejecutar(id: string) {
    const antes = await this.eventos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Evento no encontrado');
    if (antes.etapa !== EtapaEvento.confirmado) {
      throw new BadRequestException(
        'Solo se marcan como realizados eventos confirmados',
      );
    }

    const despues = await this.eventos.actualizar(id, {
      etapa: EtapaEvento.realizado,
      realizadoEn: new Date(),
    });

    await this.auditoria.registrar({
      tipoEntidad: 'evento',
      entidadId: id,
      accion: 'realizar',
      actorTipo: 'vendedor',
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    const postventa = await this.postventa.enviarFormulario({
      correoCliente: antes.cliente?.correo,
      nombreCliente: antes.cliente?.nombreCompleto ?? 'Cliente',
      codigoEvento: antes.cotizacion?.codigo ?? null,
      fechaEvento: antes.fechaEvento,
    });

    if (postventa.enviado) {
      await this.auditoria.registrar({
        tipoEntidad: 'evento',
        entidadId: id,
        accion: 'postventa_enviada',
        actorTipo: 'sistema',
        metadata: { correo: antes.cliente?.correo },
      });
    } else if (postventa.motivo && postventa.motivo !== 'deshabilitado') {
      await this.auditoria.registrar({
        tipoEntidad: 'evento',
        entidadId: id,
        accion: 'postventa_omitida',
        actorTipo: 'sistema',
        metadata: { motivo: postventa.motivo },
      });
    }

    this.events.eventoActualizado(id, 'Evento realizado');

    return mapEventoResponse(despues);
  }
}
