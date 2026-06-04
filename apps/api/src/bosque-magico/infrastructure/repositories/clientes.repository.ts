import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ClientesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(q?: string): Prisma.BosqueMagicoClienteWhereInput {
    const term = q?.trim();
    if (!term) return {};
    return {
      OR: [
        { nombreCompleto: { contains: term, mode: 'insensitive' } },
        { celular: { contains: term } },
        { correo: { contains: term, mode: 'insensitive' } },
      ],
    };
  }

  buscarPorCelular(celular: string) {
    return this.prisma.bosqueMagicoCliente.findFirst({
      where: { celular },
      orderBy: { creadoEn: 'desc' },
    });
  }

  buscarPorCorreo(correo: string) {
    return this.prisma.bosqueMagicoCliente.findFirst({
      where: { correo: { equals: correo, mode: 'insensitive' } },
      orderBy: { creadoEn: 'desc' },
    });
  }

  listar(params?: { q?: string; skip?: number; take?: number }) {
    return this.prisma.bosqueMagicoCliente.findMany({
      where: this.buildWhere(params?.q),
      orderBy: { actualizadoEn: 'desc' },
      skip: params?.skip,
      take: params?.take ?? 20,
      include: {
        _count: {
          select: {
            cotizaciones: true,
            eventos: true,
            cumpleaneros: true,
          },
        },
      },
    });
  }

  contar(q?: string) {
    return this.prisma.bosqueMagicoCliente.count({ where: this.buildWhere(q) });
  }

  crear(data: Prisma.BosqueMagicoClienteCreateInput) {
    return this.prisma.bosqueMagicoCliente.create({ data });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoCliente.findUnique({
      where: { id },
      include: {
        cumpleaneros: { orderBy: { nombre: 'asc' } },
        cotizaciones: {
          orderBy: { creadoEn: 'desc' },
          take: 20,
          select: {
            id: true,
            codigo: true,
            etapa: true,
            montoTotal: true,
            fechaEvento: true,
            creadoEn: true,
          },
        },
        eventos: {
          orderBy: { fechaEvento: 'desc' },
          take: 10,
          select: {
            id: true,
            fechaEvento: true,
            turno: true,
            etapa: true,
            montoTotal: true,
          },
        },
      },
    });
  }

  actualizar(id: string, data: Prisma.BosqueMagicoClienteUpdateInput) {
    return this.prisma.bosqueMagicoCliente.update({ where: { id }, data });
  }
}
