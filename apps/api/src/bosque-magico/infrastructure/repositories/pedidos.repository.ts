import { Injectable } from '@nestjs/common';
import {
  AreaPedido,
  EtapaPedido,
  Prisma,
  TipoPedido,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { toDecimal } from '../../domain/utils/decimal';

@Injectable()
export class PedidosRepository {
  constructor(private readonly prisma: PrismaService) {}

  private includeRelaciones = {
    producto: { select: { id: true, codigo: true, nombre: true, categoria: true } },
    proveedor: { select: { id: true, nombre: true, celular: true } },
  };

  listarPorEvento(eventoId: string) {
    return this.prisma.bosqueMagicoPedido.findMany({
      where: { eventoId },
      orderBy: [{ area: 'asc' }, { nombre: 'asc' }],
      include: this.includeRelaciones,
    });
  }

  listarOperaciones(desde?: Date, hasta?: Date) {
    return this.prisma.bosqueMagicoPedido.findMany({
      where: {
        etapa: { notIn: [EtapaPedido.cerrado, EtapaPedido.cancelado] },
        ...(desde || hasta
          ? {
              evento: {
                fechaEvento: {
                  ...(desde ? { gte: desde } : {}),
                  ...(hasta ? { lte: hasta } : {}),
                },
              },
            }
          : {}),
      },
      orderBy: [{ evento: { fechaEvento: 'asc' } }, { area: 'asc' }],
      include: {
        ...this.includeRelaciones,
        evento: {
          select: {
            id: true,
            fechaEvento: true,
            turno: true,
            etapa: true,
            cliente: { select: { nombreCompleto: true } },
          },
        },
      },
    });
  }

  contarPorEvento(eventoId: string) {
    return this.prisma.bosqueMagicoPedido.count({ where: { eventoId } });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoPedido.findUnique({
      where: { id },
      include: this.includeRelaciones,
    });
  }

  crear(data: {
    eventoId: string;
    productoId?: string;
    proveedorId?: string;
    tipo: TipoPedido;
    nombre: string;
    cantidad: number;
    area: AreaPedido;
    fechaRequerida?: Date;
    costo: number;
    notas?: string;
    etapa?: EtapaPedido;
  }) {
    return this.prisma.bosqueMagicoPedido.create({
      data: {
        eventoId: data.eventoId,
        productoId: data.productoId,
        proveedorId: data.proveedorId,
        tipo: data.tipo,
        nombre: data.nombre,
        cantidad: data.cantidad,
        area: data.area,
        fechaRequerida: data.fechaRequerida,
        costo: toDecimal(data.costo),
        notas: data.notas,
        etapa: data.etapa ?? EtapaPedido.pendiente,
      },
      include: this.includeRelaciones,
    });
  }

  crearMuchos(items: Parameters<PedidosRepository['crear']>[0][]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.bosqueMagicoPedido.create({
          data: {
            eventoId: item.eventoId,
            productoId: item.productoId,
            proveedorId: item.proveedorId,
            tipo: item.tipo,
            nombre: item.nombre,
            cantidad: item.cantidad,
            area: item.area,
            fechaRequerida: item.fechaRequerida,
            costo: toDecimal(item.costo),
            notas: item.notas,
            etapa: item.etapa ?? EtapaPedido.pendiente,
          },
          include: this.includeRelaciones,
        }),
      ),
    );
  }

  actualizar(id: string, data: Prisma.BosqueMagicoPedidoUpdateInput) {
    return this.prisma.bosqueMagicoPedido.update({
      where: { id },
      data,
      include: this.includeRelaciones,
    });
  }
}
