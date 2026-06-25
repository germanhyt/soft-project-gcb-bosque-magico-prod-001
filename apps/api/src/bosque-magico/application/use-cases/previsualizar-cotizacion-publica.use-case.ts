import { BadRequestException, Injectable } from '@nestjs/common';
import { ComposicionPaqueteService } from '../../domain/services/composicion-paquete.service';
import type { SeleccionPaqueteInput } from '../../domain/services/composicion-paquete.types';
import { PrevisualizarCotizacionPublicaDto } from '../dto/previsualizar-cotizacion-publica.dto';
import { AnticipacionEventoService } from '../../domain/services/anticipacion-evento.service';

@Injectable()
export class PrevisualizarCotizacionPublicaUseCase {
  constructor(
    private readonly composicionPaquete: ComposicionPaqueteService,
    private readonly anticipacion: AnticipacionEventoService,
  ) {}

  private mapearSeleccion(
    dto: PrevisualizarCotizacionPublicaDto,
  ): SeleccionPaqueteInput {
    const base = dto.seleccion ?? {};
    return {
      showIds: base.showIds,
      extraIds: base.extraIds,
      snackId: base.snackId,
      cajitasCantidad: base.cajitasCantidad,
      piqueos: base.piqueos,
      adicionales: [
        ...(base.adicionales ?? []),
        ...(dto.items ?? []).map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
        })),
      ],
    };
  }

  async ejecutar(dto: PrevisualizarCotizacionPublicaDto) {
    await this.anticipacion.validar(dto.fechaEvento);

    const fechaEvento = new Date(dto.fechaEvento);
    if (Number.isNaN(fechaEvento.getTime())) {
      throw new BadRequestException('Fecha de evento inválida');
    }

    const { composicion, montos, esFinSemana } =
      await this.composicionPaquete.armarCotizacionConPaquete({
        paquete: dto.paquete,
        fechaEvento,
        cantidadNinos: dto.cantidadNinos,
        seleccion: this.mapearSeleccion(dto),
      });

    return {
      paquete: composicion.paqueteNombre,
      fechaEvento: dto.fechaEvento,
      cantidadNinos: dto.cantidadNinos,
      esFinSemana,
      montos: {
        base: montos.montoBase,
        ninosExtra: montos.montoNinosExtra,
        items: montos.montoItems,
        total: montos.montoTotal,
      },
      advertencia: montos.advertencia,
      resumenPaquete: composicion.resumen,
      items: composicion.items.map((item) => ({
        productoId: item.productoId,
        nombre: item.nombre,
        categoria: item.tipo,
        cantidad: item.cantidad,
        cantidadMinima: 1,
        precioUnitario: item.precioUnitario,
        precioCatalogo: item.precioCatalogo,
        subtotal: item.precioUnitario * item.cantidad,
        origenItem: item.origenItem,
        creditoAplicado: item.creditoAplicado,
        notas: item.notas,
      })),
    };
  }
}
