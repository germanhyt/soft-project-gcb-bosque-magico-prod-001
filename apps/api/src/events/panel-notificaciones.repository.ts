import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BosquePanelEvent,
  BosquePanelEventType,
} from './panel-event.types';

export type PanelNotificacionDto = BosquePanelEvent & { leida: boolean };

@Injectable()
export class PanelNotificacionesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(data: {
    type: BosquePanelEventType;
    titulo: string;
    mensaje: string;
    entidad?: { tipo: string; id: string };
  }): Promise<BosquePanelEvent> {
    const row = await this.prisma.bosqueMagicoPanelNotificacion.create({
      data: {
        tipo: data.type,
        titulo: data.titulo,
        mensaje: data.mensaje,
        entidadTipo: data.entidad?.tipo,
        entidadId: data.entidad?.id,
      },
    });

    return this.toEvent(row);
  }

  async listarParaUsuario(usuarioId: string, limite = 50): Promise<PanelNotificacionDto[]> {
    const rows = await this.prisma.bosqueMagicoPanelNotificacion.findMany({
      orderBy: { creadoEn: 'desc' },
      take: Math.min(limite + 100, 200),
      include: {
        estadosUsuario: {
          where: { usuarioId },
          take: 1,
        },
      },
    });

    return rows
      .filter((n) => !n.estadosUsuario[0]?.oculta)
      .slice(0, limite)
      .map((n) => ({
        ...this.toEvent(n),
        leida: n.estadosUsuario[0]?.leida ?? false,
      }));
  }

  async marcarLeida(notificacionId: string, usuarioId: string) {
    await this.prisma.bosqueMagicoPanelNotificacionUsuario.upsert({
      where: {
        notificacionId_usuarioId: { notificacionId, usuarioId },
      },
      create: {
        notificacionId,
        usuarioId,
        leida: true,
        leidaEn: new Date(),
      },
      update: {
        leida: true,
        leidaEn: new Date(),
      },
    });
  }

  async marcarTodasLeidas(usuarioId: string) {
    const visibles = await this.listarIdsVisibles(usuarioId);
    if (visibles.length === 0) return;

    const now = new Date();
    await this.prisma.$transaction(
      visibles.map((notificacionId) =>
        this.prisma.bosqueMagicoPanelNotificacionUsuario.upsert({
          where: {
            notificacionId_usuarioId: { notificacionId, usuarioId },
          },
          create: {
            notificacionId,
            usuarioId,
            leida: true,
            leidaEn: now,
          },
          update: {
            leida: true,
            leidaEn: now,
          },
        }),
      ),
    );
  }

  async ocultarTodas(usuarioId: string) {
    const visibles = await this.listarIdsVisibles(usuarioId);
    if (visibles.length === 0) return;

    await this.prisma.$transaction(
      visibles.map((notificacionId) =>
        this.prisma.bosqueMagicoPanelNotificacionUsuario.upsert({
          where: {
            notificacionId_usuarioId: { notificacionId, usuarioId },
          },
          create: {
            notificacionId,
            usuarioId,
            oculta: true,
          },
          update: {
            oculta: true,
          },
        }),
      ),
    );
  }

  private async listarIdsVisibles(usuarioId: string) {
    const rows = await this.prisma.bosqueMagicoPanelNotificacion.findMany({
      orderBy: { creadoEn: 'desc' },
      take: 200,
      select: {
        id: true,
        estadosUsuario: {
          where: { usuarioId },
          select: { oculta: true },
          take: 1,
        },
      },
    });

    return rows.filter((n) => !n.estadosUsuario[0]?.oculta).map((n) => n.id);
  }

  private toEvent(row: {
    id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    entidadTipo: string | null;
    entidadId: string | null;
    creadoEn: Date;
  }): BosquePanelEvent {
    return {
      id: row.id,
      type: row.tipo as BosquePanelEventType,
      titulo: row.titulo,
      mensaje: row.mensaje,
      entidad:
        row.entidadTipo && row.entidadId
          ? { tipo: row.entidadTipo, id: row.entidadId }
          : undefined,
      creadoEn: row.creadoEn.toISOString(),
    };
  }
}
