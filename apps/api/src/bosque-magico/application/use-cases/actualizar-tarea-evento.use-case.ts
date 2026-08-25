import { Injectable, NotFoundException } from '@nestjs/common';
import { ActualizarTareaEventoDto } from '../dto/actualizar-tarea-evento.dto';
import { mapTareaEventoResponse } from '../../domain/mappers/tarea-evento.mapper';
import { parseFechaCalendarioUtc } from '../../domain/utils/fecha-calendario';
import { TareasEventoRepository } from '../../infrastructure/repositories/tareas-evento.repository';

@Injectable()
export class ActualizarTareaEventoUseCase {
  constructor(private readonly tareas: TareasEventoRepository) {}

  async ejecutar(id: string, dto: ActualizarTareaEventoDto) {
    const existe = await this.tareas.obtenerPorId(id);
    if (!existe) throw new NotFoundException('Tarea no encontrada');

    const row = await this.tareas.actualizar(id, {
      ...(dto.etapa !== undefined ? { etapa: dto.etapa } : {}),
      ...(dto.area !== undefined ? { area: dto.area } : {}),
      ...(dto.responsable !== undefined
        ? { responsable: dto.responsable }
        : {}),
      ...(dto.fechaVencimiento !== undefined
        ? { fechaVencimiento: parseFechaCalendarioUtc(dto.fechaVencimiento) }
        : {}),
      ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
    });

    return mapTareaEventoResponse(row);
  }
}
