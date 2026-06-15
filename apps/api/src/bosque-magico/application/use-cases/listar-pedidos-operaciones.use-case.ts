import { Injectable } from '@nestjs/common';
import { mapPedidoResponse } from '../../domain/mappers/pedido.mapper';
import { parseFechaCalendarioUtc } from '../../domain/utils/fecha-calendario';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

@Injectable()
export class ListarPedidosOperacionesUseCase {
  constructor(private readonly pedidos: PedidosRepository) {}

  async ejecutar(desde?: string, hasta?: string) {
    const rows = await this.pedidos.listarOperaciones(
      desde ? parseFechaCalendarioUtc(desde) : undefined,
      hasta ? parseFechaCalendarioUtc(hasta) : undefined,
    );
    return rows.map((row) => ({
      ...mapPedidoResponse(row),
      evento: row.evento,
    }));
  }
}
