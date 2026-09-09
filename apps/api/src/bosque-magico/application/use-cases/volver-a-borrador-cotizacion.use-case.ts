import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaContrato, EtapaCotizacion, EtapaEvento } from '@prisma/client';
import { mapCotizacionResponse } from '../../domain/mappers/cotizacion.mapper';
import {
  CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA,
  flujoVolverBorradorAceptadaHabilitado,
} from '../../domain/constants/flujo-config';
import { SolicitudCotizacionSyncService } from '../../domain/services/solicitud-cotizacion-sync.service';
import { EventsService } from '../../../events/events.service';
import { ConfiguracionRepository } from '../../infrastructure/repositories/configuracion.repository';
import { ContratosRepository } from '../../infrastructure/repositories/contratos.repository';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { CancelarEventoUseCase } from './cancelar-evento.use-case';

type EventoResumen = { id: string; etapa: EtapaEvento };

@Injectable()
export class VolverABorradorCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
    private readonly configuracion: ConfiguracionRepository,
    private readonly contratos: ContratosRepository,
    private readonly cancelarEvento: CancelarEventoUseCase,
    private readonly solicitudSync: SolicitudCotizacionSyncService,
  ) {}

  async ejecutar(id: string) {
    const cot = await this.cotizaciones.obtenerPorId(id);
    if (!cot) throw new NotFoundException('Cotización no encontrada');

    if (cot.etapa === EtapaCotizacion.enviada) {
      return this.marcarBorrador(id, cot.codigo, false);
    }

    if (cot.etapa !== EtapaCotizacion.aceptada) {
      throw new BadRequestException(
        'Solo se puede volver a borrador una cotización enviada o aceptada',
      );
    }

    const cfg = await this.configuracion.obtenerPorClave(
      CLAVE_FLUJO_COTIZACION_VOLVER_BORRADOR_ACEPTADA,
    );
    if (!flujoVolverBorradorAceptadaHabilitado(cfg?.valor)) {
      throw new BadRequestException(
        'Volver a borrador una cotización aceptada está deshabilitado en Configuración.',
      );
    }

    const evento = (cot as { eventos?: EventoResumen[] }).eventos?.[0];
    if (
      evento &&
      (evento.etapa === EtapaEvento.confirmado ||
        evento.etapa === EtapaEvento.realizado)
    ) {
      throw new BadRequestException(
        'No se puede volver a borrador: el evento ya está confirmado o realizado.',
      );
    }

    if (evento?.etapa === EtapaEvento.por_confirmar) {
      const contrato = await this.contratos.obtenerPorEventoId(evento.id);
      if (
        contrato &&
        (contrato.etapa === EtapaContrato.enviado ||
          contrato.etapa === EtapaContrato.firmado)
      ) {
        throw new BadRequestException(
          'No se puede volver a borrador: el contrato ya fue enviado o firmado.',
        );
      }
      await this.cancelarEvento.ejecutar(evento.id, {
        motivo: 'Cotización volvió a borrador',
      });
    }

    const solicitudId =
      (cot as { solicitudId?: string | null }).solicitudId ??
      (cot as { solicitud?: { id?: string } | null }).solicitud?.id;
    await this.solicitudSync.alDeshacerAceptacion(solicitudId);

    return this.marcarBorrador(id, cot.codigo, true);
  }

  private async marcarBorrador(
    id: string,
    codigo: string,
    deshacerAceptacion: boolean,
  ) {
    const despues = await this.cotizaciones.actualizarEtapa(id, {
      etapa: EtapaCotizacion.borrador,
      enviadaEn: null,
      canalEnvio: null,
      aceptadaEn: null,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'cotizacion',
      entidadId: id,
      accion: 'volver_borrador',
      actorTipo: 'vendedor',
      metadata: deshacerAceptacion
        ? { deshacerAceptacion: true }
        : undefined,
    });

    this.events.cotizacionActualizada(
      id,
      codigo,
      deshacerAceptacion
        ? 'Se deshizo la aceptación. El evento en agenda se canceló. Edita y reenvía la cotización.'
        : 'Volvió a borrador para editar. El cliente no puede aceptar hasta reenviar.',
    );

    return mapCotizacionResponse(despues);
  }
}
