import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaContrato, Prisma } from '@prisma/client';
import { mapContratoResponse } from '../../domain/mappers/contrato.mapper';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';

@Injectable()
export class MarcarContratoEnviadoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(id: string) {
    const antes = await this.contratos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Contrato no encontrado');
    if (antes.etapa === EtapaContrato.anulado) {
      throw new BadRequestException('El contrato está anulado');
    }
    if (antes.etapa === EtapaContrato.firmado) {
      return mapContratoResponse(antes);
    }

    const despues =
      antes.etapa === EtapaContrato.enviado
        ? antes
        : await this.contratos.marcarEnviado(id);

    if (despues.id === antes.id && antes.etapa !== EtapaContrato.enviado) {
      await this.auditoria.registrar({
        tipoEntidad: 'contrato',
        entidadId: id,
        accion: 'enviar',
        actorTipo: 'vendedor',
        antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
        despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
      });
    }

    return mapContratoResponse(despues);
  }
}

@Injectable()
export class MarcarContratoFirmadoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  async ejecutar(id: string) {
    const antes = await this.contratos.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Contrato no encontrado');
    if (antes.etapa === EtapaContrato.anulado) {
      throw new BadRequestException('El contrato está anulado');
    }
    if (antes.etapa === EtapaContrato.firmado) {
      return mapContratoResponse(antes);
    }

    const despues = await this.contratos.marcarFirmado(id);

    await this.auditoria.registrar({
      tipoEntidad: 'contrato',
      entidadId: id,
      accion: 'firmar',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    return mapContratoResponse(despues);
  }
}
