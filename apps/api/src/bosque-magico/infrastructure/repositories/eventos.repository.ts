import { Injectable } from '@nestjs/common';
import { EtapaEvento, Prisma, TurnoInteres } from '@prisma/client';
import {
  fechaCalendarioHoy,
  inicioDiaCalendarioUtc,
} from '../../domain/utils/fecha-calendario';
import { PrismaService } from '../../../prisma/prisma.service';

export type ListarEventosParams = {
  etapa?: EtapaEvento;
  desde?: Date;
  hasta?: Date;
  turno?: TurnoInteres;
};

@Injectable()
export class EventosRepository {
  constructor(private readonly prisma: PrismaService) {}

  private includeRelaciones = {
    cliente: { select: { nombreCompleto: true, celular: true, correo: true } },
    cumpleanero: { select: { nombre: true, edad: true } },
    cotizacion: { select: { id: true, codigo: true, paquete: true } },
  };

  listar(params?: ListarEventosParams) {
    const where: Prisma.BosqueMagicoEventoWhereInput = {};
    if (params?.etapa) where.etapa = params.etapa;
    if (params?.turno) where.turno = params.turno;
    if (params?.desde || params?.hasta) {
      where.fechaEvento = {};
      if (params.desde) where.fechaEvento.gte = params.desde;
      if (params.hasta) where.fechaEvento.lte = params.hasta;
    }
    return this.prisma.bosqueMagicoEvento.findMany({
      where,
      orderBy: [{ fechaEvento: 'asc' }, { turno: 'asc' }],
      include: this.includeRelaciones,
      take: 200,
    });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoEvento.findUnique({
      where: { id },
      include: this.includeRelaciones,
    });
  }

  obtenerPorIdParaContrato(id: string) {
    return this.prisma.bosqueMagicoEvento.findUnique({
      where: { id },
      include: {
        cliente: true,
        cumpleanero: true,
        contrato: true,
        cotizacion: {
          include: { items: { orderBy: { nombre: 'asc' } } },
        },
      },
    });
  }

  existeConflictoActivo(
    fecha: Date,
    turno: TurnoInteres,
    zona: string,
    excluirEventoId?: string,
  ) {
    return this.prisma.bosqueMagicoEvento.findFirst({
      where: {
        fechaEvento: fecha,
        turno,
        zona,
        etapa: { in: [EtapaEvento.por_confirmar, EtapaEvento.confirmado] },
        ...(excluirEventoId ? { id: { not: excluirEventoId } } : {}),
      },
    });
  }

  actualizar(id: string, data: Prisma.BosqueMagicoEventoUpdateInput) {
    return this.prisma.bosqueMagicoEvento.update({
      where: { id },
      data,
      include: this.includeRelaciones,
    });
  }

  contarPorEtapa() {
    return this.prisma.bosqueMagicoEvento.groupBy({
      by: ['etapa'],
      _count: { _all: true },
    });
  }

  proximos(limite = 5) {
    const hoy = inicioDiaCalendarioUtc(fechaCalendarioHoy());
    return this.prisma.bosqueMagicoEvento.findMany({
      where: {
        fechaEvento: { gte: hoy },
        etapa: { in: [EtapaEvento.por_confirmar, EtapaEvento.confirmado] },
      },
      orderBy: { fechaEvento: 'asc' },
      take: limite,
      include: this.includeRelaciones,
    });
  }

  /** Eventos activos en una fecha de calendario exacta (YYYY-MM-DD). */
  listarEnFecha(fechaCalendario: string, etapas: EtapaEvento[]) {
    const dia = inicioDiaCalendarioUtc(fechaCalendario);
    return this.prisma.bosqueMagicoEvento.findMany({
      where: {
        fechaEvento: dia,
        etapa: { in: etapas },
      },
      orderBy: [{ turno: 'asc' }],
      include: this.includeRelaciones,
    });
  }
}
