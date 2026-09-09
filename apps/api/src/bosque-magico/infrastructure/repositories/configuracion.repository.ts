import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ConfiguracionRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarPublicas() {
    return this.prisma.bosqueMagicoConfiguracion.findMany({
      where: { esPublico: true },
      orderBy: { clave: 'asc' },
    });
  }

  obtenerPorClave(clave: string) {
    return this.prisma.bosqueMagicoConfiguracion.findUnique({
      where: { clave },
    });
  }

  listarTodas() {
    return this.prisma.bosqueMagicoConfiguracion.findMany({
      orderBy: { clave: 'asc' },
    });
  }

  actualizarValor(clave: string, valor: unknown, descripcion?: string) {
    return this.prisma.bosqueMagicoConfiguracion.update({
      where: { clave },
      data: {
        valor: valor as never,
        ...(descripcion !== undefined ? { descripcion } : {}),
      },
    });
  }

  async crearSiNoExiste(data: {
    clave: string;
    valor: unknown;
    descripcion: string;
    esPublico?: boolean;
  }) {
    const existing = await this.obtenerPorClave(data.clave);
    if (existing) return existing;
    return this.prisma.bosqueMagicoConfiguracion.create({
      data: {
        clave: data.clave,
        valor: data.valor as never,
        descripcion: data.descripcion,
        esPublico: data.esPublico ?? false,
      },
    });
  }
}
