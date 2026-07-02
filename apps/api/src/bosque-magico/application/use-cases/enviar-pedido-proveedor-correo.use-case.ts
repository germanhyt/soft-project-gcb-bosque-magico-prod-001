import { Injectable, NotFoundException } from '@nestjs/common';
import { mapPedidoResponse } from '../../domain/mappers/pedido.mapper';
import { NotificacionProveedorService } from '../../domain/services/notificacion-proveedor.service';
import { EnviarPedidoProveedorCorreoDto } from '../dto/enviar-pedido-proveedor-correo.dto';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';

@Injectable()
export class EnviarPedidoProveedorCorreoUseCase {
  constructor(
    private readonly pedidos: PedidosRepository,
    private readonly notificacionProveedor: NotificacionProveedorService,
  ) {}

  async ejecutar(id: string, dto: EnviarPedidoProveedorCorreoDto) {
    const existe = await this.pedidos.obtenerPorId(id);
    if (!existe) throw new NotFoundException('Pedido no encontrado');

    const envio = await this.notificacionProveedor.enviarCorreoManual(id, {
      asunto: dto.correoAsunto,
      cuerpo: dto.correoCuerpo,
    });

    const pedido = mapPedidoResponse(existe);
    const correo = existe.proveedor?.correo?.trim() ?? '';

    return {
      pedido,
      correoDestino: correo,
      enviadoPorSmtp: envio.enviado,
      correoAsunto: envio.asunto ?? '',
      correoCuerpo: envio.cuerpo ?? '',
      motivo: envio.motivo,
    };
  }
}
