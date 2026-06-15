import { Injectable } from '@nestjs/common';
import { CategoriaProducto, EtapaProducto, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { toDecimal } from '../../domain/utils/decimal';

@Injectable()
export class ProductosRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarActivos() {
    return this.listar({ soloActivos: true });
  }

  listar(params?: { soloActivos?: boolean; categoria?: CategoriaProducto }) {
    return this.prisma.bosqueMagicoProducto.findMany({
      where: {
        ...(params?.soloActivos ? { etapa: EtapaProducto.activo } : {}),
        ...(params?.categoria ? { categoria: params.categoria } : {}),
      },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoProducto.findUnique({ where: { id } });
  }

  obtenerPorCodigo(codigo: string) {
    return this.prisma.bosqueMagicoProducto.findUnique({ where: { codigo } });
  }

  crear(data: {
    codigo: string;
    nombre: string;
    categoria: CategoriaProducto;
    precioLunesViernes: number;
    precioFinSemana: number;
    cantidadMinima?: number;
    descripcion?: string;
    origen?: import('@prisma/client').OrigenProducto;
    costoInterno?: number;
    proveedorId?: string;
  }) {
    return this.prisma.bosqueMagicoProducto.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        categoria: data.categoria,
        precioLunesViernes: toDecimal(data.precioLunesViernes),
        precioFinSemana: toDecimal(data.precioFinSemana),
        cantidadMinima: data.cantidadMinima ?? 1,
        descripcion: data.descripcion,
        origen: data.origen,
        costoInterno:
          data.costoInterno != null ? toDecimal(data.costoInterno) : undefined,
        proveedorId: data.proveedorId,
      },
    });
  }

  actualizar(id: string, data: Prisma.BosqueMagicoProductoUpdateInput) {
    return this.prisma.bosqueMagicoProducto.update({ where: { id }, data });
  }
}
