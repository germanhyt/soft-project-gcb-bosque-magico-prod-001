import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CumpleanerosRepository {
  constructor(private readonly prisma: PrismaService) {}

  crear(data: Prisma.BosqueMagicoCumpleaneroCreateInput) {
    return this.prisma.bosqueMagicoCumpleanero.create({ data });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoCumpleanero.findUnique({ where: { id } });
  }
}
