import { Injectable, NotFoundException } from '@nestjs/common';
import { OrigenProducto, TipoPedido } from '@prisma/client';
import { areaDesdeCategoria } from '../../domain/utils/area-pedido';
import { fromDecimal } from '../../domain/utils/decimal';
import { mapPedidoResponse } from '../../domain/mappers/pedido.mapper';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { PedidosRepository } from '../../infrastructure/repositories/pedidos.repository';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class GenerarPedidosEventoUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: EventosRepository,
    private readonly pedidos: PedidosRepository,
  ) {}

  async ejecutar(eventoId: string) {
    const existentes = await this.pedidos.contarPorEvento(eventoId);
    if (existentes > 0) return [];

    const evento = await this.eventos.obtenerPorIdParaContrato(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const items = evento.cotizacion?.items ?? [];
    const aCrear: Parameters<PedidosRepository['crear']>[0][] = [];

    for (const item of items) {
      if (!item.productoId) continue;
      const producto = await this.prisma.bosqueMagicoProducto.findUnique({
        where: { id: item.productoId },
      });
      if (!producto) continue;

      const esProveedor =
        producto.origen === OrigenProducto.proveedor || !!producto.proveedorId;
      if (!esProveedor) continue;

      const costoUnit =
        producto.costoInterno != null
          ? fromDecimal(producto.costoInterno)
          : fromDecimal(item.precioUnitario) * 0.6;

      aCrear.push({
        eventoId,
        productoId: producto.id,
        proveedorId: producto.proveedorId ?? undefined,
        tipo: TipoPedido.proveedor,
        nombre: item.nombre,
        cantidad: item.cantidad,
        area: areaDesdeCategoria(producto.categoria),
        fechaRequerida: evento.fechaEvento,
        costo: costoUnit * item.cantidad,
      });
    }

    if (aCrear.length === 0) return [];

    const rows = await this.pedidos.crearMuchos(aCrear);
    return rows.map(mapPedidoResponse);
  }
}
