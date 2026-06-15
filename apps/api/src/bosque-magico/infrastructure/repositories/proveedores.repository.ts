import { Injectable } from '@nestjs/common';
import { EtapaProveedor, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProveedoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(params?: { soloActivos?: boolean }) {
    return this.prisma.bosqueMagicoProveedor.findMany({
      where: params?.soloActivos ? { etapa: EtapaProveedor.activo } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoProveedor.findUnique({ where: { id } });
  }

  crear(data: {
    nombre: string;
    contacto?: string;
    celular?: string;
    correo?: string;
    categorias?: string[];
    notas?: string;
  }) {
    return this.prisma.bosqueMagicoProveedor.create({
      data: {
        nombre: data.nombre,
        contacto: data.contacto,
        celular: data.celular,
        correo: data.correo,
        categorias: data.categorias ?? [],
        notas: data.notas,
      },
    });
  }

  actualizar(id: string, data: Prisma.BosqueMagicoProveedorUpdateInput) {
    return this.prisma.bosqueMagicoProveedor.update({ where: { id }, data });
  }
}
