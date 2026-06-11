import { BadRequestException, Injectable } from '@nestjs/common';
import { EtapaProducto } from '@prisma/client';
import { CalculoPreciosService } from '../../domain/services/calculo-precios.service';
import { fromDecimal } from '../../domain/utils/decimal';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';
import { PrevisualizarCotizacionPublicaDto } from '../dto/previsualizar-cotizacion-publica.dto';

@Injectable()
export class PrevisualizarCotizacionPublicaUseCase {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly calculo: CalculoPreciosService,
  ) {}

  async ejecutar(dto: PrevisualizarCotizacionPublicaDto) {
    const fechaEvento = new Date(dto.fechaEvento);
    if (Number.isNaN(fechaEvento.getTime())) {
      throw new BadRequestException('Fecha de evento inválida');
    }

    const feriados = await this.calculo.obtenerFeriados();
    const esFinSemana = this.calculo.esTarifaFinSemana(fechaEvento, feriados);
    const itemsSeleccionados = [];
    for (const item of dto.items ?? []) {
      const producto = await this.productos.obtenerPorId(item.productoId);
      if (!producto || producto.etapa !== EtapaProducto.activo) {
        throw new BadRequestException(
          `Producto ${item.productoId} no disponible para cotizar`,
        );
      }

      if (item.cantidad < producto.cantidadMinima) {
        throw new BadRequestException(
          `${producto.nombre} requiere mínimo ${producto.cantidadMinima} unidad(es)`,
        );
      }

      const precioUnitario = esFinSemana
        ? fromDecimal(producto.precioFinSemana)
        : fromDecimal(producto.precioLunesViernes);
      const subtotal = precioUnitario * item.cantidad;

      itemsSeleccionados.push({
        productoId: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        cantidad: item.cantidad,
        cantidadMinima: producto.cantidadMinima,
        precioUnitario,
        subtotal,
      });
    }

    const tarifas = await this.calculo.obtenerTarifas();
    const resultado = this.calculo.calcular(
      tarifas,
      fechaEvento,
      dto.cantidadNinos,
      itemsSeleccionados.map((item) => ({
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
      })),
      feriados,
    );

    return {
      paquete: dto.paquete ?? null,
      fechaEvento: dto.fechaEvento,
      cantidadNinos: dto.cantidadNinos,
      esFinSemana: resultado.esFinSemana,
      montos: {
        base: resultado.montoBase,
        ninosExtra: resultado.montoNinosExtra,
        items: resultado.montoItems,
        total: resultado.montoTotal,
      },
      advertencia: resultado.advertencia,
      items: itemsSeleccionados,
    };
  }
}
