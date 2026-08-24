import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EtapaSolicitud, Prisma } from '@prisma/client';
import { mapCotizacionResponse } from '../../domain/mappers/cotizacion.mapper';
import { ComposicionPaqueteService } from '../../domain/services/composicion-paquete.service';
import type {
  ItemPaqueteResuelto,
  SeleccionPaqueteInput,
} from '../../domain/services/composicion-paquete.types';
import { ClientesRepository } from '../../infrastructure/repositories/clientes.repository';
import {
  CotizacionesRepository,
  type ItemCotizacionInput,
} from '../../infrastructure/repositories/cotizaciones.repository';
import { CumpleanerosRepository } from '../../infrastructure/repositories/cumpleaneros.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';
import { SolicitudCotizacionSyncService } from '../../domain/services/solicitud-cotizacion-sync.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { CrearCotizacionDto } from '../dto/crear-cotizacion.dto';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';
import { TomarSolicitudUseCase } from './tomar-solicitud.use-case';

@Injectable()
export class CrearCotizacionUseCase {
  constructor(
    private readonly clientes: ClientesRepository,
    private readonly cumpleaneros: CumpleanerosRepository,
    private readonly cotizaciones: CotizacionesRepository,
    private readonly solicitudes: SolicitudesRepository,
    private readonly solicitudSync: SolicitudCotizacionSyncService,
    private readonly composicionPaquete: ComposicionPaqueteService,
    private readonly auditoria: AuditoriaRepository,
    private readonly anticipacion: AnticipacionEventoService,
    private readonly tomarSolicitud: TomarSolicitudUseCase,
  ) {}

  private itemsDesdeComposicion(
    resueltos: ItemPaqueteResuelto[],
  ): ItemCotizacionInput[] {
    return resueltos.map((item) => ({
      productoId: item.productoId,
      tipo: item.tipo,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      notas: item.notas,
      origenItem: item.origenItem,
      creditoAplicado: item.creditoAplicado,
    }));
  }

  private mapearSeleccion(dto: CrearCotizacionDto): SeleccionPaqueteInput {
    const base = dto.seleccion ?? {};
    const adicionalesManuales =
      dto.items
        ?.filter((i) => i.productoId)
        .map((i) => ({
          productoId: i.productoId!,
          cantidad: i.cantidad,
        })) ?? [];
    return {
      showIds: base.showIds,
      extraIds: base.extraIds,
      snackId: base.snackId,
      snackCantidad: base.snackCantidad,
      cajitasCantidad: base.cajitasCantidad,
      cajitasClasica: base.cajitasClasica,
      cajitasSaludable: base.cajitasSaludable,
      piqueos: base.piqueos,
      adicionales: [...(base.adicionales ?? []), ...adicionalesManuales],
      salitaLoungeCantidad: base.salitaLoungeCantidad,
      derechoIngresoShowExterno: base.derechoIngresoShowExterno,
      derechoIngresoDecoracionExterno: base.derechoIngresoDecoracionExterno,
      derechoIngresoCarritoSnackExterno: base.derechoIngresoCarritoSnackExterno,
      derechoDecoracionPersonalizada: base.derechoDecoracionPersonalizada,
    };
  }

  async ejecutar(dto: CrearCotizacionDto, usuarioAsignadoId?: string) {
    if (dto.solicitudId) {
      const sol = await this.solicitudes.obtenerPorId(dto.solicitudId);
      if (!sol) throw new NotFoundException('Solicitud no encontrada');
      if (sol.etapa === EtapaSolicitud.cerrada) {
        throw new BadRequestException(
          'No se puede cotizar una solicitud cerrada',
        );
      }
      await this.tomarSolicitud.ejecutarSiPendiente(
        dto.solicitudId,
        usuarioAsignadoId,
      );
    }

    await this.anticipacion.validar(dto.fechaEvento);

    const fechaEvento = new Date(dto.fechaEvento);
    let cliente = await this.clientes.buscarPorCelular(dto.cliente.celular);
    if (!cliente) {
      cliente = await this.clientes.crear({
        nombreCompleto: dto.cliente.nombreCompleto,
        celular: dto.cliente.celular,
        correo: dto.cliente.correo,
      });
    } else {
      cliente = await this.clientes.actualizar(cliente.id, {
        nombreCompleto: dto.cliente.nombreCompleto,
        correo: dto.cliente.correo ?? cliente.correo,
      });
    }

    const cumpleanero = await this.cumpleaneros.crear({
      nombre: dto.cumpleanero.nombre,
      edad: dto.cumpleanero.edad,
      tematicaFavorita: dto.cumpleanero.tematicaFavorita ?? dto.tematica,
      cliente: { connect: { id: cliente.id } },
    });

    const { composicion, montos } =
      await this.composicionPaquete.armarCotizacionConPaquete({
        paquete: dto.paquete,
        fechaEvento,
        cantidadNinos: dto.cantidadNinos,
        seleccion: this.mapearSeleccion(dto),
        horasAdicionales: dto.horasAdicionales,
      });

    const items = this.itemsDesdeComposicion(composicion.items);

    const cotizacion = await this.cotizaciones.crearConItems({
      solicitudId: dto.solicitudId,
      clienteId: cliente.id,
      cumpleaneroId: cumpleanero.id,
      fechaEvento,
      turno: dto.turno,
      cantidadNinos: dto.cantidadNinos,
      tematica: dto.tematica,
      paquete: composicion.paqueteNombre,
      notas: dto.notas,
      montos: {
        montoBase: montos.montoBase,
        montoNinosExtra: montos.montoNinosExtra,
        montoItems: montos.montoItems,
        montoTotal: montos.montoTotal,
      },
      items,
    });

    await this.solicitudSync.alCrearCotizacion(dto.solicitudId);

    await this.auditoria.registrar({
      tipoEntidad: 'cotizacion',
      entidadId: cotizacion.id,
      accion: 'crear',
      actorTipo: 'vendedor',
      despues: JSON.parse(JSON.stringify(cotizacion)) as Prisma.InputJsonValue,
    });

    return {
      ...mapCotizacionResponse(cotizacion),
      advertencia: montos.advertencia,
      resumenPaquete: composicion.resumen,
    };
  }
}
