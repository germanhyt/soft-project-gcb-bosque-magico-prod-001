import { Injectable, NotFoundException } from '@nestjs/common';
import { TipoPedido } from '@prisma/client';
import { mapPedidoPublicoResponse } from '../../domain/mappers/pedido.mapper';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

@Injectable()
export class ObtenerPedidoPublicoUseCase {
  constructor(private readonly pedidos: PedidosRepository) {}

  async ejecutar(token: string) {
    const pedido = await this.pedidos.obtenerPorToken(token);
    if (!pedido || pedido.tipo !== TipoPedido.proveedor) {
      throw new NotFoundException('Pedido no disponible');
    }
    return mapPedidoPublicoResponse(pedido);
  }
}
