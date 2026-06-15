import { Injectable, NotFoundException } from '@nestjs/common';
import { CrearTareaEventoDto } from '../dto/crear-tarea-evento.dto';
import { mapTareaEventoResponse } from '../../domain/mappers/tarea-evento.mapper';
import { parseFechaCalendarioUtc } from '../../domain/utils/fecha-calendario';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { TareasEventoRepository } from '../../infrastructure/repositories/tareas-evento.repository';

@Injectable()
export class CrearTareaEventoUseCase {
  constructor(
    private readonly tareas: TareasEventoRepository,
    private readonly eventos: EventosRepository,
  ) {}

  async ejecutar(eventoId: string, dto: CrearTareaEventoDto) {
    const evento = await this.eventos.obtenerPorId(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const row = await this.tareas.crear({
      eventoId,
      area: dto.area,
      nombre: dto.nombre,
      responsable: dto.responsable,
      fechaVencimiento: dto.fechaVencimiento
        ? parseFechaCalendarioUtc(dto.fechaVencimiento)
        : evento.fechaEvento,
      notas: dto.notas,
    });

    return mapTareaEventoResponse(row);
  }
}
