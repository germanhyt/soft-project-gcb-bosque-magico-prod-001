import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.bosqueMagicoUsuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  findById(id: string) {
    return this.prisma.bosqueMagicoUsuario.findUnique({ where: { id } });
  }

  listarPanel() {
    return this.prisma.bosqueMagicoUsuario.findMany({
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true,
        email: true,
        nombre: true,
        permisos: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });
  }

  crear(data: {
    email: string;
    nombre: string;
    passwordHash: string;
    permisos: string[];
  }) {
    return this.prisma.bosqueMagicoUsuario.create({
      data: {
        email: data.email,
        nombre: data.nombre,
        passwordHash: data.passwordHash,
        permisos: data.permisos,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        permisos: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });
  }

  actualizar(
    id: string,
    data: Partial<{
      nombre: string;
      passwordHash: string;
      permisos: string[];
      activo: boolean;
    }>,
  ) {
    return this.prisma.bosqueMagicoUsuario.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nombre: true,
        permisos: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });
  }

  upsertAdmin(data: {
    email: string;
    nombre: string;
    passwordHash: string;
    permisos: string[];
  }) {
    return this.prisma.bosqueMagicoUsuario.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        nombre: data.nombre,
        passwordHash: data.passwordHash,
        permisos: data.permisos,
        activo: true,
      },
      update: {
        nombre: data.nombre,
        passwordHash: data.passwordHash,
        permisos: data.permisos,
        activo: true,
      },
    });
  }
}
