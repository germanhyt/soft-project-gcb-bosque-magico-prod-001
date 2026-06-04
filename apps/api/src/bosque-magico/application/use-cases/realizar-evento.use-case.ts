import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaEvento, Prisma } from '@prisma/client';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

@Injectable()
export class RealizarEventoUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
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

    this.events.eventoActualizado(id, 'Evento realizado');

    return mapEventoResponse(despues);
  }
}
