import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PADDING_CODIGO_DEFAULT } from '../../domain/constants/codigos-secuencia';

@Injectable()
export class SecuenciasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Incrementa el correlativo del prefijo en transacción y devuelve el código formateado.
   */
  async siguiente(
    prefijo: string,
    padding = PADDING_CODIGO_DEFAULT,
  ): Promise<string> {
    const row = await this.prisma.$transaction(async (tx) => {
      const existente = await tx.bosqueMagicoSecuencia.findUnique({
        where: { prefijo },
      });
      if (!existente) {
        return tx.bosqueMagicoSecuencia.create({
          data: { prefijo, ultimo: 1, padding },
        });
      }
      return tx.bosqueMagicoSecuencia.update({
        where: { prefijo },
        data: { ultimo: { increment: 1 } },
      });
    });
    return `${prefijo}${String(row.ultimo).padStart(row.padding, '0')}`;
  }
}
