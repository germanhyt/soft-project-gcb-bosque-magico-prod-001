import { Injectable, Logger } from '@nestjs/common';
import { CanalSolicitud, Prisma } from '@prisma/client';
import { CrearSolicitudPublicaDto } from '../dto/crear-solicitud-publica.dto';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { EventsService } from '../../../events/events.service';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';
import { CrearCotizacionUseCase } from './crear-cotizacion.use-case';
import {
  mapearSolicitudLandingACotizacion,
  puedeCrearCotizacionBorradorDesdeLanding,
} from '../../domain/mappers/landing-a-cotizacion.mapper';
import { IdentidadContactoService } from '../../domain/services/identidad-contacto.service';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';

@Injectable()
export class CrearSolicitudPublicaUseCase {
  private readonly logger = new Logger(CrearSolicitudPublicaUseCase.name);

  constructor(
    private readonly solicitudes: SolicitudesRepository,
    private readonly auditoria: AuditoriaRepository,
    private readonly events: EventsService,
    private readonly crearCotizacion: CrearCotizacionUseCase,
    private readonly identidad: IdentidadContactoService,
    private readonly anticipacion: AnticipacionEventoService,
  ) {}

  async ejecutar(dto: CrearSolicitudPublicaDto) {
    if (dto.evento?.fechaTentativa) {
      await this.anticipacion.validar(dto.evento.fechaTentativa);
    }
    const resumenIdentidad = await this.identidad.resolver(
      dto.cliente.celular,
      dto.cliente.correo,
    );
    const duplicado = resumenIdentidad.solicitudesRecientes24h;

    const notasPartes: string[] = [];
    if (dto.observaciones) notasPartes.push(dto.observaciones);
    if (dto.cumpleanero?.nombre) {
      notasPartes.push(
        `Cumpleañero: ${dto.cumpleanero.nombre}${dto.cumpleanero.edad ? ` (${dto.cumpleanero.edad} años)` : ''}`,
      );
    }
    if (dto.evento?.tematica)
      notasPartes.push(`Temática: ${dto.evento.tematica}`);
    if (dto.evento?.paquete) notasPartes.push(`Paquete: ${dto.evento.paquete}`);

    try {
      await this.identidad.vincularClienteConSolicitud({
        nombreContacto: dto.cliente.nombre,
        celular: dto.cliente.celular,
        correo: dto.cliente.correo,
      });
    } catch (err) {
      this.logger.warn(
        `No se pudo vincular cliente para solicitud landing`,
        err instanceof Error ? err.message : String(err),
      );
    }

    const solicitud = await this.solicitudes.crear({
      nombreContacto: dto.cliente.nombre,
      celular: dto.cliente.celular,
      correo: dto.cliente.correo,
      canal: CanalSolicitud.landing,
      detalleOrigen: 'landing',
      fechaTentativa: dto.evento?.fechaTentativa
        ? new Date(dto.evento.fechaTentativa)
        : undefined,
      turnoInteres: dto.evento?.turno,
      cantidadNinosEstimada: dto.evento?.cantidadNinos,
      notas: notasPartes.length ? notasPartes.join('\n') : undefined,
      payloadOrigen: JSON.parse(
        JSON.stringify({ dto, posibleDuplicado: !!duplicado }),
      ) as Prisma.InputJsonValue,
    });

    await this.auditoria.registrar({
      tipoEntidad: 'solicitud',
      entidadId: solicitud.id,
      accion: 'crear_publica',
      actorTipo: 'cliente',
      despues: JSON.parse(JSON.stringify(solicitud)) as Prisma.InputJsonValue,
      metadata: {
        canal: 'landing',
        posibleDuplicado: !!duplicado,
        totalSolicitudesPrevias: resumenIdentidad.totalSolicitudes,
        clienteConocidoId: resumenIdentidad.clienteId,
      },
    });

    this.events.solicitudNueva(solicitud.id, solicitud.nombreContacto);

    let cotizacion: { id: string; codigo: string; etapa: string } | undefined;
    if (puedeCrearCotizacionBorradorDesdeLanding(dto)) {
      try {
        const creada = await this.crearCotizacion.ejecutar(
          mapearSolicitudLandingACotizacion(solicitud.id, dto),
        );
        cotizacion = {
          id: creada.id,
          codigo: creada.codigo,
          etapa: creada.etapa,
        };
        await this.auditoria.registrar({
          tipoEntidad: 'solicitud',
          entidadId: solicitud.id,
          accion: 'cotizacion_borrador_auto',
          actorTipo: 'sistema',
          metadata: { cotizacionId: cotizacion.id, codigo: cotizacion.codigo },
        });
        this.events.cotizacionBorradorLista(
          solicitud.id,
          cotizacion.id,
          cotizacion.codigo,
          solicitud.nombreContacto,
        );
      } catch (err) {
        this.logger.warn(
          `No se pudo crear borrador automático para solicitud ${solicitud.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    const solicitudActualizada = await this.solicitudes.obtenerPorId(
      solicitud.id,
    );

    return {
      solicitud: solicitudActualizada ?? solicitud,
      posibleDuplicado: !!duplicado,
      identidad: {
        totalSolicitudes: resumenIdentidad.totalSolicitudes + 1,
        clienteConocido: !!resumenIdentidad.clienteId,
        clienteId: resumenIdentidad.clienteId,
      },
      cotizacion,
    };
  }
}
