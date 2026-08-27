import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EtapaTareaEvento } from '@prisma/client';
import { mapTareaEventoResponse } from '../../domain/mappers/tarea-evento.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { TareasEventoRepository } from '../../infrastructure/repositories/tareas-evento.repository';

@Injectable()
export class AplicarEtapaTareasEventoUseCase {
  constructor(
    private readonly tareas: TareasEventoRepository,
    private readonly eventos: EventosRepository,
  ) {}

  async ejecutar(eventoId: string, etapa: EtapaTareaEvento) {
    const evento = await this.eventos.obtenerPorId(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const total = await this.tareas.contarPorEvento(eventoId);
    if (total === 0) {
      throw new BadRequestException('No hay puntos en el checklist para actualizar');
    }

    await this.tareas.actualizarEtapaPorEvento(eventoId, etapa);
    const rows = await this.tareas.listarPorEvento(eventoId);
    return rows.map(mapTareaEventoResponse);
  }
}
