import { Injectable } from '@nestjs/common';
import { AreaPedido, EtapaTareaEvento, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TareasEventoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarPorEvento(eventoId: string) {
    return this.prisma.bosqueMagicoTareaEvento.findMany({
      where: { eventoId },
      orderBy: [{ area: 'asc' }, { nombre: 'asc' }],
    });
  }

  contarPorEvento(eventoId: string) {
    return this.prisma.bosqueMagicoTareaEvento.count({ where: { eventoId } });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoTareaEvento.findUnique({ where: { id } });
  }

  crear(data: {
    eventoId: string;
    area: AreaPedido;
    nombre: string;
    responsable?: string;
    fechaVencimiento?: Date;
    notas?: string;
    etapa?: EtapaTareaEvento;
  }) {
    return this.prisma.bosqueMagicoTareaEvento.create({ data });
  }

  crearMuchas(
    items: {
      eventoId: string;
      area: AreaPedido;
      nombre: string;
      responsable?: string;
      fechaVencimiento?: Date;
      notas?: string;
      etapa?: EtapaTareaEvento;
    }[],
  ) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.bosqueMagicoTareaEvento.create({ data: item }),
      ),
    );
  }

  actualizar(id: string, data: Prisma.BosqueMagicoTareaEventoUpdateInput) {
    return this.prisma.bosqueMagicoTareaEvento.update({ where: { id }, data });
  }

  actualizarEtapaPorEvento(eventoId: string, etapa: EtapaTareaEvento) {
    return this.prisma.bosqueMagicoTareaEvento.updateMany({
      where: { eventoId },
      data: { etapa },
    });
  }
}
