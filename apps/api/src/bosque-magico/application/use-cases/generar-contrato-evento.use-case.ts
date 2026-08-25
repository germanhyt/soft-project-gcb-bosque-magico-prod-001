import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EtapaContrato,
  EtapaCotizacion,
  EtapaEvento,
  Prisma,
  TipoDocumento,
} from '@prisma/client';
import {
  CONTRATO_GARANTIA_DEFAULT,
  CONTRATO_TERMINOS_VERSION,
} from '../../domain/constants/contrato.constants';
import { mapContratoResponse } from '../../domain/mappers/contrato.mapper';
import { buildContratoSnapshot } from '../../domain/utils/contrato-snapshot';
import {
  fechaCalendarioHoy,
  inicioDiaCalendarioUtc,
} from '../../domain/utils/fecha-calendario';
import { fromDecimal } from '../../domain/utils/decimal';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ClientesRepository } from '../../infrastructure/repositories/clientes.repository';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { EventosRepository } from '../../infrastructure/repositories/eventos.repository';
import { GenerarContratoDto } from '../dto/generar-contrato.dto';

@Injectable()
export class GenerarContratoEventoUseCase {
  constructor(
    private readonly eventos: EventosRepository,
    private readonly contratos: ContratosRepository,
    private readonly config: ConfiguracionRepository,
    private readonly clientes: ClientesRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  private async garantiaReferencial(dto: GenerarContratoDto) {
    if (dto.montoGarantia != null) return dto.montoGarantia;
    const cfg = await this.config.obtenerPorClave(
      'contrato.garantia_referencial',
    );
    const v = cfg?.valor;
    return typeof v === 'number' ? v : CONTRATO_GARANTIA_DEFAULT;
  }

  async ejecutar(eventoId: string, dto: GenerarContratoDto) {
    const evento = await this.eventos.obtenerPorIdParaContrato(eventoId);
    if (!evento) throw new NotFoundException('Evento no encontrado');
    if (evento.etapa === EtapaEvento.cancelado) {
      throw new BadRequestException(
        'No se puede generar contrato para un evento cancelado',
      );
    }
    if (evento.cotizacion.etapa !== EtapaCotizacion.aceptada) {
      throw new BadRequestException('La cotización debe estar aceptada');
    }

    const montoTotal = fromDecimal(evento.montoTotal);
    const adelanto2Raw = dto.adelanto2Monto ?? 0;
    const adelanto1 = Math.min(Math.max(dto.adelanto1Monto, 0), montoTotal);
    const adelanto2 = Math.min(
      Math.max(adelanto2Raw, 0),
      Math.max(montoTotal - adelanto1, 0),
    );
    if (adelanto1 + adelanto2 > montoTotal) {
      throw new BadRequestException(
        'La suma de adelantos no puede superar el monto total del evento.',
      );
    }
    const montoAdelanto = adelanto1 + adelanto2;
    const montoPendiente = Math.max(montoTotal - montoAdelanto, 0);
    const montoGarantia = await this.garantiaReferencial(dto);
    const fechaEmision = inicioDiaCalendarioUtc(fechaCalendarioHoy());
    const snapshotJson = buildContratoSnapshot(evento) as Prisma.InputJsonValue;

    if (evento.cliente.numeroDocumento !== dto.numeroDocumento.trim()) {
      await this.clientes.actualizar(evento.clienteId, {
        numeroDocumento: dto.numeroDocumento.trim(),
        tipoDocumento:
          dto.tipoComprobante === 'factura'
            ? TipoDocumento.ruc
            : TipoDocumento.dni,
      });
    }

    const payload = {
      fechaEmision,
      montoTotal,
      montoAdelanto,
      montoPendiente,
      montoGarantia,
      adelanto1Monto: adelanto1,
      adelanto1Fecha: dto.adelanto1Fecha
        ? inicioDiaCalendarioUtc(dto.adelanto1Fecha)
        : null,
      adelanto2Monto: adelanto2 > 0 ? adelanto2 : null,
      adelanto2Fecha:
        adelanto2 > 0 && dto.adelanto2Fecha
          ? inicioDiaCalendarioUtc(dto.adelanto2Fecha)
          : null,
      tipoComprobante: dto.tipoComprobante,
      documentoTributario: dto.documentoTributario.trim(),
      numeroDocumento: dto.numeroDocumento.trim(),
      horarioInicio: dto.horarioInicio.trim(),
      horarioFin: dto.horarioFin.trim(),
      terminosVersion: CONTRATO_TERMINOS_VERSION,
      snapshotJson,
    };

    const existente = evento.contrato;
    let contrato;

    if (existente) {
      if (
        existente.etapa === EtapaContrato.enviado ||
        existente.etapa === EtapaContrato.firmado
      ) {
        return {
          ...mapContratoResponse(existente),
          reimpresion: true,
        };
      }
      contrato = await this.contratos.actualizarBorrador(existente.id, payload);
      await this.auditoria.registrar({
        tipoEntidad: 'contrato',
        entidadId: contrato.id,
        accion: 'actualizar_borrador',
        actorTipo: 'vendedor',
        despues: JSON.parse(JSON.stringify(contrato)) as Prisma.InputJsonValue,
        metadata: { eventoId },
      });
    } else {
      contrato = await this.contratos.crear({
        eventoId,
        cotizacionId: evento.cotizacionId,
        numero: '',
        ...payload,
      });
      await this.auditoria.registrar({
        tipoEntidad: 'contrato',
        entidadId: contrato.id,
        accion: 'generar',
        actorTipo: 'vendedor',
        despues: JSON.parse(JSON.stringify(contrato)) as Prisma.InputJsonValue,
        metadata: { eventoId, cotizacionId: evento.cotizacionId },
      });
    }

    return {
      ...mapContratoResponse(contrato),
      reimpresion: false,
    };
  }
}
