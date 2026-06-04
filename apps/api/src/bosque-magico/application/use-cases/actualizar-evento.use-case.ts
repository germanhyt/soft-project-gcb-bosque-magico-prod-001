import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaEvento, Prisma } from '@prisma/client';
import { ActualizarEventoDto } from '../dto/actualizar-evento.dto';
import { mapEventoResponse } from '../../domain/mappers/evento.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';

@Injectable()
export class ActualizarEventoUseCase {
  constructor(private readonly eventos: EventosRepository) {}

  async ejecutar(id: string, dto: ActualizarEventoDto) {
    const evento = await this.eventos.obtenerPorId(id);
    if (!evento) throw new NotFoundException('Evento no encontrado');
    if (
      evento.etapa === EtapaEvento.cancelado ||
      evento.etapa === EtapaEvento.realizado
    ) {
      throw new BadRequestException('No se puede editar un evento finalizado');
    }

    const despues = await this.eventos.actualizar(id, {
      ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
      ...(dto.tematica !== undefined ? { tematica: dto.tematica } : {}),
    });
    return mapEventoResponse(despues);
  }
}
