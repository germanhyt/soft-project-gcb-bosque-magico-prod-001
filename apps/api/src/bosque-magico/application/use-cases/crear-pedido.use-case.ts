import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrigenProducto, TipoPedido } from '@prisma/client';
import { CrearPedidoDto } from '../dto/crear-pedido.dto';
import { mapPedidoResponse } from '../../domain/mappers/pedido.mapper';
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

    const row = await this.pedidos.crear({
      eventoId,
      productoId: dto.productoId,
      proveedorId,
      tipo: dto.tipo,
      nombre: dto.nombre,
      cantidad: dto.cantidad,
      area: dto.area,
      fechaRequerida: dto.fechaRequerida
        ? parseFechaCalendarioUtc(dto.fechaRequerida)
        : evento.fechaEvento,
      costo: dto.costo,
      notas: dto.notas,
    });

    return mapPedidoResponse(row);
  }
}
