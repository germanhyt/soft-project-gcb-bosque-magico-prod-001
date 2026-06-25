import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrigenProducto, TipoPedido } from '@prisma/client';
import { CrearPedidoDto } from '../dto/crear-pedido.dto';
import { mapPedidoResponse } from '../../domain/mappers/pedido.mapper';
import { NotificacionProveedorService } from '../../domain/services/notificacion-proveedor.service';
import { parseFechaCalendarioUtc } from '../../domain/utils/fecha-calendario';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';
import { ProveedoresRepository } from '../../infrastructure/repositories/proveedores.repository';

@Injectable()
export class CrearPedidoUseCase {
  constructor(
    private readonly pedidos: PedidosRepository,
    private readonly eventos: EventosRepository,
    private readonly productos: ProductosRepository,
    private readonly proveedores: ProveedoresRepository,
    private readonly notificacionProveedor: NotificacionProveedorService,
  ) {}

  async ejecutar(eventoId: string, dto: CrearPedidoDto) {
    const evento = await this.eventos.obtenerPorId(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');

    let proveedorId = dto.proveedorId;
    if (dto.productoId) {
      const producto = await this.productos.obtenerPorId(dto.productoId);
      if (!producto) throw new NotFoundException('Producto no encontrado');
      if (dto.tipo === TipoPedido.proveedor && producto.origen !== OrigenProducto.proveedor) {
        throw new BadRequestException('El producto no es de proveedor externo');
      }
      if (!proveedorId && producto.proveedorId) {
        proveedorId = producto.proveedorId;
      }
    }

    if (proveedorId) {
      const prov = await this.proveedores.obtenerPorId(proveedorId);
      if (!prov) throw new NotFoundException('Proveedor no encontrado');
    }

    let fechaRequerida = evento.fechaEvento;
    if (dto.fechaRequerida) {
      try {
        fechaRequerida = parseFechaCalendarioUtc(dto.fechaRequerida);
      } catch {
        throw new BadRequestException(
          'Fecha requerida inválida. Use formato YYYY-MM-DD.',
        );
      }
    }

    const row = await this.pedidos.crear({
      eventoId,
      productoId: dto.productoId,
      proveedorId,
      tipo: dto.tipo,
      nombre: dto.nombre,
      cantidad: dto.cantidad,
      area: dto.area,
      fechaRequerida,
      costo: dto.costo,
      notas: dto.notas,
    });

    if (dto.tipo === TipoPedido.proveedor) {
      await this.notificacionProveedor.notificarPedidoCreado(row.id);
    }

    return mapPedidoResponse(row);
  }
}
