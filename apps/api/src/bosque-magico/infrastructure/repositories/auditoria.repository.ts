import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditoriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  registrar(data: {
    tipoEntidad: string;
    entidadId: string;
    accion: string;
    actorTipo: string;
    actorId?: string;
    antes?: Prisma.InputJsonValue;
    despues?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.bosqueMagicoAuditoria.create({ data });
  }

  listarPorEntidad(tipoEntidad: string, entidadId: string, limite = 50) {
    return this.prisma.bosqueMagicoAuditoria.findMany({
      where: { tipoEntidad, entidadId },
      orderBy: { creadoEn: 'desc' },
      take: limite,
    });
  }

  /**
   * Idempotencia suave: busca una acción previa cuya metadata contenga
   * las claves/valores indicados (p.ej. { ventana: 'dias:7' }).
   */
  async existeAccion(
    tipoEntidad: string,
    entidadId: string,
    accion: string,
    metadataMatch?: Record<string, string | number | boolean>,
  ): Promise<boolean> {
    const rows = await this.prisma.bosqueMagicoAuditoria.findMany({
      where: { tipoEntidad, entidadId, accion },
      orderBy: { creadoEn: 'desc' },
      take: 20,
      select: { metadata: true },
    });
    if (!metadataMatch) return rows.length > 0;
    return rows.some((row) => {
      if (
        !row.metadata ||
        typeof row.metadata !== 'object' ||
        Array.isArray(row.metadata)
      ) {
        return false;
      }
      const meta = row.metadata as Record<string, unknown>;
      return Object.entries(metadataMatch).every(([k, v]) => meta[k] === v);
    });
  }
}
