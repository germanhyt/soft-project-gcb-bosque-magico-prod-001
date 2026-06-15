import { Injectable, NotFoundException } from '@nestjs/common';
import { TAREAS_DEFECTO_EVENTO } from '../../domain/constants/tareas-evento.constants';
import { mapTareaEventoResponse } from '../../domain/mappers/tarea-evento.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { TareasEventoRepository } from '../../infrastructure/repositories/tareas-evento.repository';

@Injectable()
export class GenerarTareasEventoUseCase {
  constructor(
    private readonly tareas: TareasEventoRepository,
    private readonly eventos: EventosRepository,
  ) {}

  async ejecutar(eventoId: string) {
    const existentes = await this.tareas.contarPorEvento(eventoId);
    if (existentes > 0) return [];

    const evento = await this.eventos.obtenerPorId(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const rows = await this.tareas.crearMuchas(
      TAREAS_DEFECTO_EVENTO.map((t) => ({
        eventoId,
        area: t.area,
        nombre: t.nombre,
        fechaVencimiento: evento.fechaEvento,
      })),
    );

    return rows.map(mapTareaEventoResponse);
  }
}
