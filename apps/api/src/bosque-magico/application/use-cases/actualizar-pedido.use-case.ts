import { Injectable, NotFoundException } from '@nestjs/common';
import { EtapaPedido, TipoPedido } from '@prisma/client';
import { ActualizarPedidoDto } from '../dto/actualizar-pedido.dto';
import { mapPedidoResponse } from '../../domain/mappers/pedido.mapper';
import { NotificacionProveedorService } from '../../domain/services/notificacion-proveedor.service';
import { parseFechaCalendarioUtc } from '../../domain/utils/fecha-calendario';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';
import { toDecimal } from '../../domain/utils/decimal';

@Injectable()
export class ActualizarPedidoUseCase {
  constructor(
    private readonly pedidos: PedidosRepository,
    private readonly notificacionProveedor: NotificacionProveedorService,
  ) {}

  async ejecutar(id: string, dto: ActualizarPedidoDto) {
    const existe = await this.pedidos.obtenerPorId(id);
    if (!existe) throw new NotFoundException('Pedido no encontrado');

    const row = await this.pedidos.actualizar(id, {
      ...(dto.etapa !== undefined ? { etapa: dto.etapa } : {}),
      ...(dto.area !== undefined ? { area: dto.area } : {}),
      ...(dto.cantidad !== undefined ? { cantidad: dto.cantidad } : {}),
      ...(dto.costo !== undefined ? { costo: toDecimal(dto.costo) } : {}),
      ...(dto.fechaRequerida !== undefined
        ? { fechaRequerida: parseFechaCalendarioUtc(dto.fechaRequerida) }
        : {}),
      ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
    });

    let notificacionProveedor:
      | { enviado: boolean; motivo?: string }
      | undefined;
    const pasaASolicitado =
      dto.etapa === EtapaPedido.solicitado &&
      existe.etapa !== EtapaPedido.solicitado &&
      existe.tipo === TipoPedido.proveedor;

    if (pasaASolicitado) {
      notificacionProveedor =
        await this.notificacionProveedor.notificarAlSolicitar(id);
    }

    return {
      ...mapPedidoResponse(row),
      ...(notificacionProveedor ? { notificacionProveedor } : {}),
    };
  }
}
