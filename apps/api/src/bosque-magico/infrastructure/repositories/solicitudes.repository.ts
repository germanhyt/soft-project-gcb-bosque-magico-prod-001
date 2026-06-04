import { Injectable } from '@nestjs/common';
import {
  CanalSolicitud,
  EtapaSolicitud,
  Prisma,
  TurnoInteres,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type CrearSolicitudInput = {
  nombreContacto: string;
  celular: string;
  correo?: string;
  canal: CanalSolicitud;
  detalleOrigen?: string;
  fechaTentativa?: Date;
  turnoInteres?: TurnoInteres;
  cantidadNinosEstimada?: number;
  notas?: string;
  payloadOrigen?: Prisma.InputJsonValue;
};

@Injectable()
export class SolicitudesRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: CrearSolicitudInput) {
    return this.prisma.bosqueMagicoSolicitud.create({
      data: {
        ...data,
        etapa: EtapaSolicitud.nueva,
        fechaIngreso: new Date(),
      },
    });
  }

  private buildWhere(
    etapa?: EtapaSolicitud,
    q?: string,
  ): Prisma.BosqueMagicoSolicitudWhereInput {
    const parts: Prisma.BosqueMagicoSolicitudWhereInput[] = [];
    if (etapa) parts.push({ etapa });
    const term = q?.trim();
    if (term) {
      parts.push({
        OR: [
          { nombreContacto: { contains: term, mode: 'insensitive' } },
          { celular: { contains: term } },
          { correo: { contains: term, mode: 'insensitive' } },
        ],
      });
    }
    if (parts.length === 0) return {};
    if (parts.length === 1) return parts[0];
    return { AND: parts };
  }

  listar(params?: {
    etapa?: EtapaSolicitud;
    q?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.bosqueMagicoSolicitud.findMany({
      where: this.buildWhere(params?.etapa, params?.q),
      orderBy: { creadoEn: 'desc' },
      skip: params?.skip,
      take: params?.take ?? 20,
      include: {
        cotizaciones: {
          orderBy: { creadoEn: 'desc' },
          select: { id: true, codigo: true, etapa: true, creadoEn: true },
        },
      },
    });
  }

  contar(etapa?: EtapaSolicitud, q?: string) {
    return this.prisma.bosqueMagicoSolicitud.count({
      where: this.buildWhere(etapa, q),
    });
  }

  contarPorEtapa() {
    return this.prisma.bosqueMagicoSolicitud.groupBy({
      by: ['etapa'],
      _count: { _all: true },
    });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoSolicitud.findUnique({
      where: { id },
      include: {
        cotizaciones: {
          orderBy: { creadoEn: 'desc' },
          select: { id: true, codigo: true, etapa: true, creadoEn: true },
        },
      },
    });
  }

  actualizar(id: string, data: Prisma.BosqueMagicoSolicitudUpdateInput) {
    return this.prisma.bosqueMagicoSolicitud.update({ where: { id }, data });
  }

  existeDuplicadoReciente(celular: string, correo?: string) {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.bosqueMagicoSolicitud.findFirst({
      where: {
        creadoEn: { gte: hace24h },
        OR: [{ celular }, ...(correo ? [{ correo }] : [])],
      },
    });
  }

  private wherePorIdentidad(
    celular: string,
    correo?: string,
  ): Prisma.BosqueMagicoSolicitudWhereInput {
    return {
      OR: [{ celular }, ...(correo ? [{ correo }] : [])],
    };
  }

  async estadisticasPorIdentidad(celular: string, correo?: string) {
    const where = this.wherePorIdentidad(celular, correo);
    const [total, agg] = await Promise.all([
      this.prisma.bosqueMagicoSolicitud.count({ where }),
      this.prisma.bosqueMagicoSolicitud.aggregate({
        where,
        _min: { creadoEn: true },
        _max: { creadoEn: true },
      }),
    ]);
    return {
      total,
      primeraEn: agg._min.creadoEn,
      ultimaEn: agg._max.creadoEn,
    };
  }

  listarPorIdentidad(celular: string, correo?: string, take = 15) {
    return this.prisma.bosqueMagicoSolicitud.findMany({
      where: this.wherePorIdentidad(celular, correo),
      orderBy: { creadoEn: 'desc' },
      take,
      select: {
        id: true,
        nombreContacto: true,
        canal: true,
        etapa: true,
        fechaTentativa: true,
        creadoEn: true,
      },
    });
  }
}
