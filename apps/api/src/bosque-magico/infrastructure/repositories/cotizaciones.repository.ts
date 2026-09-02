import { Injectable } from '@nestjs/common';
import {
  CanalEnvio,
  EtapaCotizacion,
  EtapaEvento,
  MotivoCierreCotizacion,
  OrigenItemCotizacion,
  Prisma,
  TipoItemCotizacion,
  TurnoInteres,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PREFIJO_CODIGO_COTIZACION } from '../../domain/constants/codigos-secuencia';
import { toDecimal } from '../../domain/utils/decimal';
import { SecuenciasRepository } from './secuencias.repository';

export type ItemCotizacionInput = {
  productoId?: string;
  tipo: TipoItemCotizacion;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  notas?: string;
  origenItem?: OrigenItemCotizacion;
  creditoAplicado?: number;
};

export type MontosCotizacion = {
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
};

@Injectable()
export class CotizacionesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secuencias: SecuenciasRepository,
  ) {}

  private generarCodigo(): Promise<string> {
    return this.secuencias.siguiente(PREFIJO_CODIGO_COTIZACION);
  }

  private generarToken(): string {
    return randomBytes(24).toString('hex');
  }

  private buildWhere(
    etapa?: EtapaCotizacion,
    q?: string,
  ): Prisma.BosqueMagicoCotizacionWhereInput {
    const parts: Prisma.BosqueMagicoCotizacionWhereInput[] = [];
    if (etapa) parts.push({ etapa });
    const term = q?.trim();
    if (term) {
      parts.push({
        OR: [
          { codigo: { contains: term, mode: 'insensitive' } },
          {
            cliente: {
              nombreCompleto: { contains: term, mode: 'insensitive' },
            },
          },
          { cliente: { celular: { contains: term } } },
        ],
      });
    }
    if (parts.length === 0) return {};
    if (parts.length === 1) return parts[0];
    return { AND: parts };
  }

  listar(params?: {
    etapa?: EtapaCotizacion;
    q?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.bosqueMagicoCotizacion.findMany({
      where: this.buildWhere(params?.etapa, params?.q),
      orderBy: { creadoEn: 'desc' },
      include: {
        cliente: true,
        cumpleanero: true,
        solicitud: { select: { id: true, nombreContacto: true, etapa: true } },
      },
      skip: params?.skip,
      take: params?.take ?? 20,
    });
  }

  contar(etapa?: EtapaCotizacion, q?: string) {
    return this.prisma.bosqueMagicoCotizacion.count({
      where: this.buildWhere(etapa, q),
    });
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoCotizacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        cumpleanero: true,
        solicitud: {
          select: { id: true, nombreContacto: true, etapa: true, canal: true },
        },
        eventos: {
          select: { id: true, etapa: true },
          take: 1,
          orderBy: { creadoEn: 'desc' },
        },
        items: { orderBy: { nombre: 'asc' } },
      },
    });
  }

  obtenerPorToken(token: string) {
    return this.prisma.bosqueMagicoCotizacion.findUnique({
      where: { tokenPublico: token },
      include: {
        cliente: {
          select: { nombreCompleto: true, celular: true, correo: true },
        },
        cumpleanero: { select: { nombre: true, edad: true } },
        items: true,
      },
    });
  }

  existeEventoActivoEnSlot(
    fecha: Date,
    turno: TurnoInteres,
    zona = 'Bosque Mágico',
  ) {
    return this.prisma.bosqueMagicoEvento.findFirst({
      where: {
        fechaEvento: fecha,
        turno,
        zona,
        etapa: { in: [EtapaEvento.por_confirmar, EtapaEvento.confirmado] },
      },
    });
  }

  async crearConItems(data: {
    solicitudId?: string;
    clienteId: string;
    cumpleaneroId: string;
    fechaEvento: Date;
    turno: TurnoInteres;
    cantidadNinos: number;
    tematica?: string;
    paquete?: string;
    notas?: string;
    montos: MontosCotizacion;
    items: ItemCotizacionInput[];
  }) {
    const codigo = await this.generarCodigo();
    const tokenPublico = this.generarToken();
    const { montos, items, ...rest } = data;

    return this.prisma.bosqueMagicoCotizacion.create({
      data: {
        codigo,
        tokenPublico,
        solicitudId: rest.solicitudId,
        clienteId: rest.clienteId,
        cumpleaneroId: rest.cumpleaneroId,
        fechaEvento: rest.fechaEvento,
        turno: rest.turno,
        cantidadNinos: rest.cantidadNinos,
        tematica: rest.tematica,
        paquete: rest.paquete,
        notas: rest.notas,
        montoBase: toDecimal(montos.montoBase),
        montoNinosExtra: toDecimal(montos.montoNinosExtra),
        montoItems: toDecimal(montos.montoItems),
        montoTotal: toDecimal(montos.montoTotal),
        items: {
          create: items.map((i) => ({
            productoId: i.productoId,
            tipo: i.tipo,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precioUnitario: toDecimal(i.precioUnitario),
            subtotal: toDecimal(i.cantidad * i.precioUnitario),
            notas: i.notas,
            origenItem: i.origenItem ?? OrigenItemCotizacion.manual,
            creditoAplicado:
              i.creditoAplicado != null
                ? toDecimal(i.creditoAplicado)
                : undefined,
          })),
        },
      },
      include: {
        cliente: true,
        cumpleanero: true,
        items: true,
      },
    });
  }

  async reemplazarItems(
    cotizacionId: string,
    items: ItemCotizacionInput[],
    montos: MontosCotizacion,
    extra: Prisma.BosqueMagicoCotizacionUpdateInput = {},
  ) {
    await this.prisma.bosqueMagicoItemCotizacion.deleteMany({
      where: { cotizacionId },
    });
    return this.prisma.bosqueMagicoCotizacion.update({
      where: { id: cotizacionId },
      data: {
        ...extra,
        montoBase: toDecimal(montos.montoBase),
        montoNinosExtra: toDecimal(montos.montoNinosExtra),
        montoItems: toDecimal(montos.montoItems),
        montoTotal: toDecimal(montos.montoTotal),
        items: {
          create: items.map((i) => ({
            productoId: i.productoId,
            tipo: i.tipo,
            nombre: i.nombre,
            cantidad: i.cantidad,
            precioUnitario: toDecimal(i.precioUnitario),
            subtotal: toDecimal(i.cantidad * i.precioUnitario),
            notas: i.notas,
            origenItem: i.origenItem ?? OrigenItemCotizacion.manual,
            creditoAplicado:
              i.creditoAplicado != null
                ? toDecimal(i.creditoAplicado)
                : undefined,
          })),
        },
      },
      include: { cliente: true, cumpleanero: true, items: true },
    });
  }

  /** Cierra cotizaciones en borrador o enviada vinculadas a una solicitud (no toca aceptadas). */
  async cerrarVinculadasASolicitud(
    solicitudId: string,
    motivoCierre: MotivoCierreCotizacion,
    comentario?: string,
  ) {
    const activas = await this.prisma.bosqueMagicoCotizacion.findMany({
      where: {
        solicitudId,
        etapa: { in: [EtapaCotizacion.borrador, EtapaCotizacion.enviada] },
      },
      select: { id: true, codigo: true, etapa: true, notas: true },
    });

    const notaExtra = comentario?.trim()
      ? `\n[Cierre solicitud] ${comentario.trim()}`
      : '';

    for (const cot of activas) {
      const notas =
        [cot.notas, notaExtra].filter(Boolean).join('').trim() || undefined;
      await this.prisma.bosqueMagicoCotizacion.update({
        where: { id: cot.id },
        data: {
          etapa: EtapaCotizacion.cerrada,
          motivoCierre,
          notas,
        },
      });
    }

    return activas.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      etapa: EtapaCotizacion.cerrada,
    }));
  }

  actualizarEtapa(id: string, data: Prisma.BosqueMagicoCotizacionUpdateInput) {
    return this.prisma.bosqueMagicoCotizacion.update({
      where: { id },
      data,
      include: { cliente: true, cumpleanero: true, items: true },
    });
  }

  crearEventoDesdeCotizacion(cotizacionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cot = await tx.bosqueMagicoCotizacion.findUniqueOrThrow({
        where: { id: cotizacionId },
      });
      const existente = await tx.bosqueMagicoEvento.findFirst({
        where: { cotizacionId },
      });
      if (existente) return existente;

      return tx.bosqueMagicoEvento.create({
        data: {
          cotizacionId: cot.id,
          clienteId: cot.clienteId,
          cumpleaneroId: cot.cumpleaneroId,
          fechaEvento: cot.fechaEvento,
          turno: cot.turno,
          tematica: cot.tematica,
          cantidadNinos: cot.cantidadNinos,
          montoTotal: cot.montoTotal,
        },
      });
    });
  }

  registrarLogEnvio(data: {
    cotizacionId: string;
    canal: CanalEnvio;
    destino: string;
    exito: boolean;
    detalle?: string;
  }) {
    return this.prisma.bosqueMagicoLogMensaje.create({
      data: {
        cotizacionId: data.cotizacionId,
        canal: data.canal,
        destino: data.destino,
        exito: data.exito,
        detalle: data.detalle,
      },
    });
  }
}
