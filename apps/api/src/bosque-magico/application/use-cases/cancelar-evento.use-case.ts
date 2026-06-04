import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaEvento, Prisma } from '@prisma/client';
import { CancelarEventoDto } from '../dto/cancelar-evento.dto';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

@Injectable()
export class CancelarEventoUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(id: string, dto: CancelarEventoDto) {
    const antes = await this.eventos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Evento no encontrado');
    if (
      antes.etapa === EtapaEvento.realizado ||
      antes.etapa === EtapaEvento.cancelado
    ) {
      throw new BadRequestException('El evento ya está cerrado operativamente');
    }

    const notas = [
      antes.notas,
      dto.motivo ? `Cancelación: ${dto.motivo}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const despues = await this.eventos.actualizar(id, {
      etapa: EtapaEvento.cancelado,
      canceladoEn: new Date(),
      notas: notas || undefined,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'evento',
      entidadId: id,
      accion: 'cancelar',
      actorTipo: 'vendedor',
      metadata: { motivo: dto.motivo },
    });

    this.events.eventoActualizado(id, 'Evento cancelado');

    return mapEventoResponse(despues);
  }
}
