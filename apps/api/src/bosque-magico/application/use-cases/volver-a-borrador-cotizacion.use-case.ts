import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaCotizacion } from '@prisma/client';
import { mapCotizacionResponse } from '../../domain/mappers/cotizacion.mapper';
import { EventsService } from '../../../events/events.service';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';

@Injectable()
export class VolverABorradorCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(id: string) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');
    if (cot.etapa !== EtapaCotizacion.enviada) {
      throw new BadRequestException(
        'Solo se puede volver a borrador una cotización enviada',
      );
    }

    const despues = await this.cotizaciones.actualizarEtapa(id, {
      etapa: EtapaCotizacion.borrador,
      enviadaEn: null,
      canalEnvio: null,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'cotizacion',
      entidadId: id,
      accion: 'volver_borrador',
      actorTipo: 'vendedor',
    });

    this.events.cotizacionActualizada(
      id,
      cot.codigo,
      'Volvió a borrador para editar. El cliente no puede aceptar hasta reenviar.',
    );

    return mapCotizacionResponse(despues);
  }
}
