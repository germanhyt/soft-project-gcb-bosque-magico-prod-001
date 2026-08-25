import { Injectable } from '@nestjs/common';
import { EtapaContrato, Prisma, TipoComprobanteContrato } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { PREFIJO_NUMERO_CONTRATO } from '../../domain/constants/codigos-secuencia';
import { toDecimal } from '../../domain/utils/decimal';
import { SecuenciasRepository } from './secuencias.repository';

export type CrearContratoInput = {
  eventoId: string;
  cotizacionId: string;
  numero: string;
  fechaEmision: Date;
  montoTotal: number;
  montoAdelanto: number;
  montoPendiente: number;
  montoGarantia: number;
  adelanto1Monto: number;
  adelanto1Fecha?: Date | null;
  adelanto2Monto?: number | null;
  adelanto2Fecha?: Date | null;
  tipoComprobante: TipoComprobanteContrato;
  documentoTributario: string;
  numeroDocumento: string;
  horarioInicio: string;
  horarioFin: string;
  terminosVersion: string;
  snapshotJson: Prisma.InputJsonValue;
};

export type ActualizarContratoBorradorInput = Omit<
  CrearContratoInput,
  'eventoId' | 'cotizacionId' | 'numero'
>;

@Injectable()
export class ContratosRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secuencias: SecuenciasRepository,
  ) {}

  private includeRelaciones = {
    evento: {
      select: {
        id: true,
        fechaEvento: true,
        turno: true,
        etapa: true,
        cliente: { select: { nombreCompleto: true, celular: true } },
      },
    },
    cotizacion: { select: { id: true, codigo: true } },
    adjuntos: {
      orderBy: { tipo: 'asc' as const },
    },
  };

  private generarNumero(): Promise<string> {
    return this.secuencias.siguiente(PREFIJO_NUMERO_CONTRATO);
  }

  private generarToken(): string {
    return randomBytes(24).toString('hex');
  }

  obtenerPorId(id: string) {
    return this.prisma.bosqueMagicoContrato.findUnique({
      where: { id },
      include: this.includeRelaciones,
    });
  }

  obtenerPorEventoId(eventoId: string) {
    return this.prisma.bosqueMagicoContrato.findUnique({
      where: { eventoId },
      include: this.includeRelaciones,
    });
  }

  obtenerPorToken(token: string) {
    return this.prisma.bosqueMagicoContrato.findUnique({
      where: { tokenPublico: token },
      include: this.includeRelaciones,
    });
  }

  private buildWhere(
    etapa?: EtapaContrato,
    q?: string,
  ): Prisma.BosqueMagicoContratoWhereInput {
    const parts: Prisma.BosqueMagicoContratoWhereInput[] = [];
    if (etapa) parts.push({ etapa });
    const term = q?.trim();
    if (term) {
      parts.push({
        OR: [
          { numero: { contains: term, mode: 'insensitive' } },
          {
            evento: {
              cliente: {
                nombreCompleto: { contains: term, mode: 'insensitive' },
              },
            },
          },
          { evento: { cliente: { celular: { contains: term } } } },
          {
            cotizacion: { codigo: { contains: term, mode: 'insensitive' } },
          },
        ],
      });
    }
    if (parts.length === 0) return {};
    if (parts.length === 1) return parts[0];
    return { AND: parts };
  }

  listar(params?: {
    etapa?: EtapaContrato;
    q?: string;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.bosqueMagicoContrato.findMany({
      where: this.buildWhere(params?.etapa, params?.q),
      orderBy: { creadoEn: 'desc' },
      skip: params?.skip,
      take: params?.take ?? 20,
      include: this.includeRelaciones,
    });
  }

  contar(etapa?: EtapaContrato, q?: string) {
    return this.prisma.bosqueMagicoContrato.count({
      where: this.buildWhere(etapa, q),
    });
  }

  async crear(input: CrearContratoInput) {
    const numero = input.numero || (await this.generarNumero());
    return this.prisma.bosqueMagicoContrato.create({
      data: {
        eventoId: input.eventoId,
        cotizacionId: input.cotizacionId,
        numero,
        tokenPublico: this.generarToken(),
        fechaEmision: input.fechaEmision,
        montoTotal: toDecimal(input.montoTotal),
        montoAdelanto: toDecimal(input.montoAdelanto),
        montoPendiente: toDecimal(input.montoPendiente),
        montoGarantia: toDecimal(input.montoGarantia),
        adelanto1Monto: toDecimal(input.adelanto1Monto),
        adelanto1Fecha: input.adelanto1Fecha ?? null,
        adelanto2Monto:
          input.adelanto2Monto != null ? toDecimal(input.adelanto2Monto) : null,
        adelanto2Fecha: input.adelanto2Fecha ?? null,
        tipoComprobante: input.tipoComprobante,
        documentoTributario: input.documentoTributario,
        numeroDocumento: input.numeroDocumento,
        horarioInicio: input.horarioInicio,
        horarioFin: input.horarioFin,
        terminosVersion: input.terminosVersion,
        snapshotJson: input.snapshotJson,
      },
      include: this.includeRelaciones,
    });
  }

  actualizarBorrador(id: string, input: ActualizarContratoBorradorInput) {
    return this.prisma.bosqueMagicoContrato.update({
      where: { id },
      data: {
        fechaEmision: input.fechaEmision,
        montoTotal: toDecimal(input.montoTotal),
        montoAdelanto: toDecimal(input.montoAdelanto),
        montoPendiente: toDecimal(input.montoPendiente),
        montoGarantia: toDecimal(input.montoGarantia),
        adelanto1Monto: toDecimal(input.adelanto1Monto),
        adelanto1Fecha: input.adelanto1Fecha ?? null,
        adelanto2Monto:
          input.adelanto2Monto != null ? toDecimal(input.adelanto2Monto) : null,
        adelanto2Fecha: input.adelanto2Fecha ?? null,
        tipoComprobante: input.tipoComprobante,
        documentoTributario: input.documentoTributario,
        numeroDocumento: input.numeroDocumento,
        horarioInicio: input.horarioInicio,
        horarioFin: input.horarioFin,
        terminosVersion: input.terminosVersion,
        snapshotJson: input.snapshotJson,
      },
      include: this.includeRelaciones,
    });
  }

  marcarEnviado(id: string) {
    return this.prisma.bosqueMagicoContrato.update({
      where: { id },
      data: { etapa: EtapaContrato.enviado, enviadoEn: new Date() },
      include: this.includeRelaciones,
    });
  }

  marcarFirmado(id: string) {
    return this.prisma.bosqueMagicoContrato.update({
      where: { id },
      data: { etapa: EtapaContrato.firmado, firmadoEn: new Date() },
      include: this.includeRelaciones,
    });
  }
}
