import { Injectable, NotFoundException } from '@nestjs/common';
import { mapTareaEventoResponse } from '../../domain/mappers/tarea-evento.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { TareasEventoRepository } from '../../infrastructure/repositories/tareas-evento.repository';

@Injectable()
export class ListarTareasEventoUseCase {
  constructor(
    private readonly tareas: TareasEventoRepository,
    private readonly eventos: EventosRepository,
  ) {}

  async ejecutar(eventoId: string) {
    const evento = await this.eventos.obtenerPorId(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');
    const rows = await this.tareas.listarPorEvento(eventoId);
    return rows.map(mapTareaEventoResponse);
  }
}
