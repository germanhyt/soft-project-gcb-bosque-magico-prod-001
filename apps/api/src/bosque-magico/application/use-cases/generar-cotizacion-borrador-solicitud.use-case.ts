import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaSolicitud } from '@prisma/client';
import { CrearSolicitudPublicaDto } from '../dto/crear-solicitud-publica.dto';
import {
  mapearSolicitudLandingACotizacion,
  puedeCrearCotizacionBorradorDesdeLanding,
} from '../../domain/mappers/landing-a-cotizacion.mapper';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';
import { EventsService } from '../../../events/events.service';
import { CrearCotizacionUseCase } from './crear-cotizacion.use-case';

type PayloadOrigenLanding = {
  dto?: CrearSolicitudPublicaDto;
};

@Injectable()
export class GenerarCotizacionBorradorSolicitudUseCase {
  constructor(
    private readonly solicitudes: SolicitudesRepository,
    private readonly crearCotizacion: CrearCotizacionUseCase,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
  ) {}

  async ejecutar(solicitudId: string, usuarioAsignadoId?: string) {
    const solicitud = await this.solicitudes.obtenerPorId(solicitudId);
    if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    if (solicitud.etapa === EtapaSolicitud.cerrada) {
      throw new BadRequestException(
        'No se puede cotizar una solicitud cerrada',
      );
    }
    if (solicitud.cotizaciones?.length) {
      throw new BadRequestException(
        'La solicitud ya tiene una cotización vinculada',
      );
    }

    const payload = solicitud.payloadOrigen as PayloadOrigenLanding | null;
    const dto = payload?.dto;
    if (!dto?.cliente) {
      throw new BadRequestException(
        'No hay datos del cotizador guardados en esta solicitud',
      );
    }
    const dtoEnriquecido: CrearSolicitudPublicaDto = {
      ...dto,
      cliente: {
        nombre: dto.cliente.nombre || solicitud.nombreContacto,
        celular: dto.cliente.celular || solicitud.celular,
        correo: dto.cliente.correo ?? solicitud.correo ?? undefined,
      },
      evento: {
        ...dto.evento,
        fechaTentativa:
          dto.evento?.fechaTentativa ??
          (solicitud.fechaTentativa
            ? solicitud.fechaTentativa.toISOString().slice(0, 10)
            : undefined),
        turno: dto.evento?.turno ?? solicitud.turnoInteres ?? undefined,
        cantidadNinos:
          dto.evento?.cantidadNinos ??
          solicitud.cantidadNinosEstimada ??
          undefined,
        paquete: dto.evento?.paquete,
        tematica: dto.evento?.tematica,
      },
    };

    if (!puedeCrearCotizacionBorradorDesdeLanding(dtoEnriquecido)) {
      throw new BadRequestException(
        'Faltan paquete, cantidad de niños o fecha tentativa para generar el borrador',
      );
    }

    const creada = await this.crearCotizacion.ejecutar(
      mapearSolicitudLandingACotizacion(solicitudId, dtoEnriquecido),
      usuarioAsignadoId,
    );

    await this.auditoria.registrar({
      tipoEntidad: 'solicitud',
      entidadId: solicitudId,
      accion: 'cotizacion_borrador_manual',
      actorTipo: 'vendedor',
      metadata: { cotizacionId: creada.id, codigo: creada.codigo },
    });

    this.events.cotizacionBorradorLista(
      solicitudId,
      creada.id,
      creada.codigo,
      solicitud.nombreContacto,
    );

    const solicitudActualizada =
      await this.solicitudes.obtenerPorId(solicitudId);

    return {
      solicitud: solicitudActualizada,
      cotizacion: creada,
    };
  }
}
