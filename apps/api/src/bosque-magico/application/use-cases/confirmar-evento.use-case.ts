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
export class ConfirmarEventoUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(id: string) {
    const antes = await this.eventos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Evento no encontrado');
    if (antes.etapa !== EtapaEvento.por_confirmar) {
      throw new BadRequestException(
        'Solo se confirman eventos en etapa Por confirmar',
      );
    }

    const conflicto = await this.eventos.existeConflictoActivo(
      antes.fechaEvento,
      antes.turno,
      antes.zona,
      id,
    );
    if (conflicto) {
      throw new BadRequestException(
        'Ya existe otro evento activo en esa fecha y turno',
      );
    }

    const despues = await this.eventos.actualizar(id, {
      etapa: EtapaEvento.confirmado,
      confirmadoEn: new Date(),
    });

    await this.auditoria.registrar({
      tipoEntidad: 'evento',
      entidadId: id,
      accion: 'confirmar',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    this.events.eventoActualizado(id, 'Evento confirmado');

    return mapEventoResponse(despues);
  }
}
