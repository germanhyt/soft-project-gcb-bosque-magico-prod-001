import { Injectable } from '@nestjs/common';
import { EtapaSolicitud, MotivoCierreSolicitud } from '@prisma/client';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';

/**
 * Mantiene alineada la etapa de la solicitud con el ciclo de vida de su cotización.
 * Ver BOSQUE_LOGICA_NEGOCIO_UX_SIMPLE.md §5.1
 */
@Injectable()
export class SolicitudCotizacionSyncService {
  constructor(private readonly solicitudes: SolicitudesRepository) {}

  async alCrearCotizacion(solicitudId?: string) {
    if (!solicitudId) return;
    const sol = await this.solicitudes.obtenerPorId(solicitudId);
    if (!sol || sol.etapa === EtapaSolicitud.cerrada) return;
    if (
      sol.etapa === EtapaSolicitud.nueva ||
      sol.etapa === EtapaSolicitud.en_atencion
    ) {
      await this.solicitudes.actualizar(solicitudId, {
        etapa: EtapaSolicitud.cotizada,
      });
    }
  }

  async alEnviarCotizacion(solicitudId?: string | null) {
    await this.alCrearCotizacion(solicitudId ?? undefined);
  }

  async alAceptarCotizacion(solicitudId?: string | null) {
    if (!solicitudId) return;
    const sol = await this.solicitudes.obtenerPorId(solicitudId);
    if (!sol || sol.etapa === EtapaSolicitud.cerrada) return;
    await this.solicitudes.actualizar(solicitudId, {
      etapa: EtapaSolicitud.cerrada,
      motivoCierre: MotivoCierreSolicitud.ganada,
    });
  }
}
