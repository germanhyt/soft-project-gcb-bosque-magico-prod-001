import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoriaProducto,
  EtapaCotizacion,
  OrigenItemCotizacion,
  Prisma,
  TipoItemCotizacion,
} from '@prisma/client';
import { mapCotizacionResponse } from '../../domain/mappers/cotizacion.mapper';
import { CalculoPreciosService } from '../../domain/services/calculo-precios.service';
import { ComposicionPaqueteService } from '../../domain/services/composicion-paquete.service';
import type {
  ItemPaqueteResuelto,
  SeleccionPaqueteInput,
} from '../../domain/services/composicion-paquete.types';
import { fromDecimal } from '../../domain/utils/decimal';
import {
  CotizacionesRepository,
  type ItemCotizacionInput,
} from '../../infrastructure/repositories/cotizaciones.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ActualizarCotizacionDto } from '../dto/actualizar-cotizacion.dto';
import { ItemCotizacionDto } from '../dto/item-cotizacion.dto';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';
import { CapacidadEventoService } from '../../domain/services/capacidad-evento.service';

@Injectable()
export class ActualizarCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly productos: ProductosRepository,
    private readonly calculo: CalculoPreciosService,
    private readonly composicionPaquete: ComposicionPaqueteService,
    private readonly auditoria: AuditoriaRepository,
    private readonly anticipacion: AnticipacionEventoService,
    private readonly capacidad: CapacidadEventoService,
  ) {}

  private categoriaATipo(cat: CategoriaProducto): TipoItemCotizacion {
    if (cat === CategoriaProducto.catering) return TipoItemCotizacion.catering;
    if (cat === CategoriaProducto.show) return TipoItemCotizacion.show;
    return TipoItemCotizacion.extra;
  }

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

  private mapearSeleccion(
    dto: ActualizarCotizacionDto,
  ): SeleccionPaqueteInput | undefined {
    if (!dto.seleccion) return undefined;
    const adicionalesManuales =
      dto.items
        ?.filter((i) => i.productoId)
        .map((i) => ({
          productoId: i.productoId!,
          cantidad: i.cantidad,
        })) ?? [];
    return {
      showIds: dto.seleccion.showIds,
      extraIds: dto.seleccion.extraIds,
      snackId: dto.seleccion.snackId,
      snackCantidad: dto.seleccion.snackCantidad,
      cajitasCantidad: dto.seleccion.cajitasCantidad,
      cajitasClasica: dto.seleccion.cajitasClasica,
      cajitasSaludable: dto.seleccion.cajitasSaludable,
      piqueos: dto.seleccion.piqueos,
      adicionales: [
        ...(dto.seleccion.adicionales ?? []),
        ...adicionalesManuales,
      ],
      salitaLoungeCantidad: dto.seleccion.salitaLoungeCantidad,
      derechoIngresoShowExterno: dto.seleccion.derechoIngresoShowExterno,
      derechoIngresoDecoracionExterno:
        dto.seleccion.derechoIngresoDecoracionExterno,
      derechoIngresoCarritoSnackExterno:
        dto.seleccion.derechoIngresoCarritoSnackExterno,
      derechoDecoracionPersonalizada:
        dto.seleccion.derechoDecoracionPersonalizada,
    };
  }

  private async resolverItemsManuales(
    items: ItemCotizacionDto[],
    fecha: Date,
    feriados: ReadonlySet<string>,
  ) {
    const esFin = this.calculo.esTarifaFinSemana(fecha, feriados);
    const resolved: ItemCotizacionInput[] = [];
    for (const item of items) {
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
          origenItem: OrigenItemCotizacion.manual,
        });
      } else {
        resolved.push({
          productoId: undefined,
          tipo: item.tipo,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          notas: item.notas,
          origenItem: OrigenItemCotizacion.manual,
        });
      }
    }
    return resolved;
  }

  async ejecutar(id: string, dto: ActualizarCotizacionDto) {
    const antes = await this.cotizaciones.obtenerPorId(id);
    if (!antes) throw new NotFoundException('Cotización no encontrada');
    if (antes.etapa !== EtapaCotizacion.borrador) {
      throw new BadRequestException(
        'Solo se pueden editar cotizaciones en borrador',
      );
    }

    const fechaEvento = dto.fechaEvento
      ? new Date(dto.fechaEvento)
      : antes.fechaEvento;
    if (dto.fechaEvento) {
      await this.anticipacion.validar(dto.fechaEvento);
    }
    const feriados = await this.calculo.obtenerFeriados();
    const turno = dto.turno ?? antes.turno;
    const cantidadNinos = dto.cantidadNinos ?? antes.cantidadNinos;
    await this.capacidad.validar(cantidadNinos);
    const paquete = dto.paquete ?? antes.paquete;
    if (!paquete?.trim()) {
      throw new BadRequestException('Debe elegir un paquete');
    }

    const seleccion = this.mapearSeleccion(dto);
    const horasAdicionalesDesdeAntes = antes.items
      .filter((i) =>
        i.nombre.toLowerCase().includes('hora adicional de espacio'),
      )
      .reduce((sum, i) => sum + i.cantidad, 0);
    const horasAdicionales = dto.horasAdicionales ?? horasAdicionalesDesdeAntes;
    let items: ItemCotizacionInput[];
    let montos;
    let resumenPaquete;

    if (seleccion) {
      const resultado = await this.composicionPaquete.armarCotizacionConPaquete(
        {
          paquete,
          fechaEvento,
          cantidadNinos,
          seleccion,
          horasAdicionales,
        },
      );
      items = this.itemsDesdeComposicion(resultado.composicion.items);
      montos = resultado.montos;
      resumenPaquete = resultado.composicion.resumen;
    } else {
      const itemsInput =
        dto.items ??
        antes.items.map((i) => ({
          productoId: i.productoId ?? undefined,
          tipo: i.tipo,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precioUnitario: fromDecimal(i.precioUnitario),
          notas: i.notas ?? undefined,
        }));

      items = await this.resolverItemsManuales(
        itemsInput,
        fechaEvento,
        feriados,
      );
      const tarifas = await this.calculo.obtenerTarifas();
      const paqueteProducto =
        await this.composicionPaquete.resolverPaquetePorNombreOCodigo(paquete);
      const esFin = this.calculo.esTarifaFinSemana(fechaEvento, feriados);
      const tarifasHoraExtra =
        await this.calculo.obtenerTarifasHoraExtraEspacio();
      if (horasAdicionales > 0) {
        const tarifaHora = esFin
          ? tarifasHoraExtra.finSemana
          : tarifasHoraExtra.lunesViernes;
        items.push({
          productoId: undefined,
          tipo: TipoItemCotizacion.extra,
          nombre: 'Hora adicional de espacio',
          cantidad: horasAdicionales,
          precioUnitario: tarifaHora,
          notas: `Horario extra del espacio (${horasAdicionales} hora(s))`,
          origenItem: OrigenItemCotizacion.adicional,
        });
      }
      const montoBasePaquete = esFin
        ? fromDecimal(paqueteProducto.precioFinSemana)
        : fromDecimal(paqueteProducto.precioLunesViernes);
      montos = this.calculo.calcular(
        tarifas,
        fechaEvento,
        cantidadNinos,
        items.map((i) => ({
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
        feriados,
        { montoBasePaquete },
      );
    }

    const despues = await this.cotizaciones.reemplazarItems(
      id,
      items,
      {
        montoBase: montos.montoBase,
        montoNinosExtra: montos.montoNinosExtra,
        montoItems: montos.montoItems,
        montoTotal: montos.montoTotal,
      },
      {
        fechaEvento,
        turno,
        cantidadNinos,
        tematica: dto.tematica ?? antes.tematica,
        paquete,
        notas: dto.notas ?? antes.notas,
      },
    );

    await this.auditoria.registrar({
      tipoEntidad: 'cotizacion',
      entidadId: id,
      accion: 'actualizar',
      actorTipo: 'vendedor',
      antes: JSON.parse(JSON.stringify(antes)) as Prisma.InputJsonValue,
      despues: JSON.parse(JSON.stringify(despues)) as Prisma.InputJsonValue,
    });

    return {
      ...mapCotizacionResponse(despues),
      advertencia: montos.advertencia,
      resumenPaquete,
    };
  }
}
