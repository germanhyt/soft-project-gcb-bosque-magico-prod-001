import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoriaProducto,
  EtapaCotizacion,
  Prisma,
  TipoItemCotizacion,
} from '@prisma/client';
import {
  mapCotizacionResponse,
  type CotizacionConItems,
} from '../../domain/mappers/cotizacion.mapper';
import { CalculoPreciosService } from '../../domain/services/calculo-precios.service';
import { fromDecimal } from '../../domain/utils/decimal';
import { CotizacionesRepository } from '../../infrastructure/repositories/cotizaciones.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repository';
import { ActualizarCotizacionDto } from '../dto/actualizar-cotizacion.dto';
import { ItemCotizacionDto } from '../dto/item-cotizacion.dto';

@Injectable()
export class ActualizarCotizacionUseCase {
  constructor(
    private readonly cotizaciones: CotizacionesRepository,
    private readonly productos: ProductosRepository,
    private readonly calculo: CalculoPreciosService,
    private readonly auditoria: AuditoriaRepository,
  ) {}

  private categoriaATipo(cat: CategoriaProducto): TipoItemCotizacion {
    if (cat === CategoriaProducto.catering) return TipoItemCotizacion.catering;
    if (cat === CategoriaProducto.show) return TipoItemCotizacion.show;
    return TipoItemCotizacion.extra;
  }

  private async resolverItems(items: ItemCotizacionDto[], fecha: Date) {
    const esFin = this.calculo.isWeekend(fecha);
    const resolved = [];
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
    const turno = dto.turno ?? antes.turno;
    const cantidadNinos = dto.cantidadNinos ?? antes.cantidadNinos;
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

    const items = await this.resolverItems(itemsInput, fechaEvento);
    const tarifas = await this.calculo.obtenerTarifas();
    const resultado = this.calculo.calcular(
      tarifas,
      fechaEvento,
      cantidadNinos,
      items.map((i) => ({
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
    );

    const despues = await this.cotizaciones.reemplazarItems(
      id,
      items,
      {
        montoBase: resultado.montoBase,
        montoNinosExtra: resultado.montoNinosExtra,
        montoItems: resultado.montoItems,
        montoTotal: resultado.montoTotal,
      },
      {
        fechaEvento,
        turno,
        cantidadNinos,
        tematica: dto.tematica ?? antes.tematica,
        paquete: dto.paquete ?? antes.paquete,
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
      advertencia: resultado.advertencia,
    };
  }
}
