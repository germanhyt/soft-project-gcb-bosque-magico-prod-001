import { Injectable } from '@nestjs/common';
import { TipoAdjuntoContrato } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ContratoAdjuntosRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarPorContrato(contratoId: string) {
    return this.prisma.bosqueMagicoContratoAdjunto.findMany({
      where: { contratoId },
      orderBy: { tipo: 'asc' },
    });
  }

  upsert(data: {
    contratoId: string;
    tipo: TipoAdjuntoContrato;
    nombreOriginal: string;
    url: string;
    mimeType?: string;
    tamanoBytes: number;
  }) {
    return this.prisma.bosqueMagicoContratoAdjunto.upsert({
      where: {
        contratoId_tipo: {
          contratoId: data.contratoId,
          tipo: data.tipo,
        },
      },
      create: data,
      update: {
        nombreOriginal: data.nombreOriginal,
        url: data.url,
        mimeType: data.mimeType,
        tamanoBytes: data.tamanoBytes,
      },
    });
  }

  obtenerPorContratoYTipo(contratoId: string, tipo: TipoAdjuntoContrato) {
    return this.prisma.bosqueMagicoContratoAdjunto.findUnique({
      where: { contratoId_tipo: { contratoId, tipo } },
    });
  }

  eliminar(id: string) {
    return this.prisma.bosqueMagicoContratoAdjunto.delete({ where: { id } });
  }
}
