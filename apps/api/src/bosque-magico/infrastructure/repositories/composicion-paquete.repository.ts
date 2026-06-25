import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ComposicionPaqueteRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarPorPaqueteId(paqueteId: string) {
    return this.prisma.bosqueMagicoProductoComposicion.findMany({
      where: { paqueteId },
      orderBy: { orden: 'asc' },
    });
  }

  reemplazarPaquete(
    paqueteId: string,
    reglas: Array<{
      modo: import('@prisma/client').ModoComposicionPaquete;
      componenteId?: string;
      cantidad?: number;
      montoCredito?: number;
      orden?: number;
      metadata?: Prisma.InputJsonValue;
    }>,
  ) {
    return this.prisma.$transaction([
      this.prisma.bosqueMagicoProductoComposicion.deleteMany({
        where: { paqueteId },
      }),
      ...reglas.map((regla) =>
        this.prisma.bosqueMagicoProductoComposicion.create({
          data: {
            paqueteId,
            modo: regla.modo,
            componenteId: regla.componenteId,
            cantidad: regla.cantidad ?? 1,
            montoCredito: regla.montoCredito,
            orden: regla.orden ?? 0,
            metadata: regla.metadata,
          },
        }),
      ),
    ]);
  }
}
