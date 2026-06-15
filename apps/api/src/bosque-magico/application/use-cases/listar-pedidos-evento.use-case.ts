import { Injectable, NotFoundException } from '@nestjs/common';
import { mapPedidoResponse } from '../../domain/mappers/pedido.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

@Injectable()
export class ListarPedidosEventoUseCase {
  constructor(
    private readonly pedidos: PedidosRepository,
    private readonly eventos: EventosRepository,
  ) {}

  async ejecutar(eventoId: string) {
    const evento = await this.eventos.obtenerPorId(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');
    const rows = await this.pedidos.listarPorEvento(eventoId);
    return rows.map(mapPedidoResponse);
  }
}
