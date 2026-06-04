import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoriaProducto,
  EtapaSolicitud,
  Prisma,
  TipoItemCotizacion,
} from '@prisma/client';
import {
  mapCotizacionResponse,
  type CotizacionConItems,
} from '../../domain/mappers/cotizacion.mapper';
import { CalculoPreciosService } from '../../domain/services/calculo-precios.service';
import { fromDecimal } from '../../domain/utils/decimal';
import { ClientesRepository } from '../../infrastructure/repositories/clientes.repository';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { CumpleanerosRepository } from '../../infrastructure/repositories/cumpleaneros.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';
import { SolicitudesRepository } from '../../infrastructure/repositories/solicitudes.repository';
import { SolicitudCotizacionSyncService } from '../../domain/services/solicitud-cotizacion-sync.service';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { CrearCotizacionDto } from '../dto/crear-cotizacion.dto';
import { ItemCotizacionDto } from '../dto/item-cotizacion.dto';

@Injectable()
export class CrearCotizacionUseCase {
  constructor(
    private readonly clientes: ClientesRepository,
    private readonly cumpleaneros: CumpleanerosRepository,
    private readonly cotizaciones: CotizacionesRepository,
    private readonly productos: ProductosRepository,
    private readonly solicitudes: SolicitudesRepository,
    private readonly solicitudSync: SolicitudCotizacionSyncService,
    private readonly calculo: CalculoPreciosService,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  private categoriaATipo(cat: CategoriaProducto): TipoItemCotizacion {
    if (cat === CategoriaProducto.catering) return TipoItemCotizacion.catering;
    if (cat === CategoriaProducto.show) return TipoItemCotizacion.show;
    return TipoItemCotizacion.extra;
  }

  private async resolverItems(
    items: ItemCotizacionDto[] | undefined,
    fecha: Date,
  ) {
    const esFin = this.calculo.isWeekend(fecha);
    const resolved = [];
    for (const item of items ?? []) {
      if (item.productoId) {
        const producto = await this.productos.obtenerPorId(item.productoId);
        if (!producto)
          throw new BadRequestException(
            `Producto ${item.productoId} no encontrado`,
          );
        const precio = esFin
          ? fromDecimal(producto.precioFinSemana)
          : fromDecimal(producto.precioLunesViernes);
        resolved.push({
          productoId: producto.id,
          tipo: this.categoriaATipo(producto.categoria),
          nombre: producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: precio,
          notas: item.notas,
        });
      } else {
        resolved.push({
          productoId: undefined,
          tipo: item.tipo,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          notas: item.notas,
        });
      }
    }
    return resolved;
  }

  async ejecutar(dto: CrearCotizacionDto) {
    if (dto.solicitudId) {
      const sol = await this.solicitudes.obtenerPorId(dto.solicitudId);
      if (!sol) throw new NotFoundException('Solicitud no encontrada');
      if (sol.etapa === EtapaSolicitud.cerrada) {
        throw new BadRequestException(
          'No se puede cotizar una solicitud cerrada',
        );
      }
    }

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

    const items = await this.resolverItems(dto.items, fechaEvento);
    const tarifas = await this.calculo.obtenerTarifas();
    const resultado = this.calculo.calcular(
      tarifas,
      fechaEvento,
      dto.cantidadNinos,
      items.map((i) => ({
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    );

    const cotizacion = await this.cotizaciones.crearConItems({
      solicitudId: dto.solicitudId,
      clienteId: cliente.id,
      cumpleaneroId: cumpleanero.id,
      fechaEvento,
      turno: dto.turno,
      cantidadNinos: dto.cantidadNinos,
      tematica: dto.tematica,
      paquete: dto.paquete,
      notas: dto.notas,
      montos: {
        montoBase: resultado.montoBase,
        montoNinosExtra: resultado.montoNinosExtra,
        montoItems: resultado.montoItems,
        montoTotal: resultado.montoTotal,
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
      advertencia: resultado.advertencia,
    };
  }
}
