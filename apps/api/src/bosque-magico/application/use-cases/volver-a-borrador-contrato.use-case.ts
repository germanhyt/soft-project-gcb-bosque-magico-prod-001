import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaContrato, EtapaEvento } from '@prisma/client';
import { mapContratoResponse } from '../../domain/mappers/contrato.mapper';
import { EventsService } from '../../../events/events.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';

const EVENTOS_BLOQUEAN_REVERTIR: EtapaEvento[] = [
  EtapaEvento.confirmado,
  EtapaEvento.realizado,
  EtapaEvento.cancelado,
];

@Injectable()
export class VolverABorradorContratoUseCase {
  constructor(
    private readonly contratos: ContratosRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(id: string) {
    const contrato = await this.contratos.obtenerPorId(id);
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    if (contrato.etapa === EtapaContrato.firmado) {
      throw new BadRequestException(
        'Un contrato firmado no puede volver a borrador. Si hay que invalidarlo, anúlalo y genera uno nuevo.',
      );
    }
    if (contrato.etapa !== EtapaContrato.enviado) {
      throw new BadRequestException(
        'Solo se puede volver a borrador un contrato enviado',
      );
    }

    const etapaEvento = contrato.evento?.etapa;
    if (etapaEvento && EVENTOS_BLOQUEAN_REVERTIR.includes(etapaEvento)) {
      throw new BadRequestException(
        'No se puede volver a borrador: el evento ya está confirmado, realizado o cancelado.',
      );
    }

    const despues = await this.contratos.marcarBorrador(id);

    await this.auditoria.registrar({
      tipoEntidad: 'contrato',
      entidadId: id,
      accion: 'volver_borrador',
      actorTipo: 'vendedor',
    });

    this.events.eventoActualizado(
      contrato.eventoId,
      `Contrato ${contrato.numero} volvió a borrador para editar`,
    );

    return mapContratoResponse(despues);
  }
}
