import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CategoriaProducto,
  EtapaProducto,
  type BosqueMagicoProducto,
} from '@prisma/client';
import { CalculoPreciosService } from './calculo-precios.service';
import { resolverComposicionPaquete } from './composicion-paquete.resolver';
import {
  coincidePaquete,
  type ComposicionRegla,
  type ProductoCotizacionRef,
  type SeleccionPaqueteInput,
} from './composicion-paquete.types';
import { fromDecimal } from '../utils/decimal';
import { ComposicionPaqueteRepository } from '../../infrastructure/repositories/composicion-paquete.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

@Injectable()
export class ComposicionPaqueteService {
  constructor(
    private readonly productos: ProductosRepository,
    private readonly composicion: ComposicionPaqueteRepository,
    private readonly calculo: CalculoPreciosService,
  ) {}

  private aRef(producto: BosqueMagicoProducto): ProductoCotizacionRef {
    return {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      subtipo: producto.subtipo,
      precioLunesViernes: fromDecimal(producto.precioLunesViernes),
      precioFinSemana: fromDecimal(producto.precioFinSemana),
      cantidadMinima: producto.cantidadMinima,
    };
  }

  async resolverPaquetePorNombreOCodigo(paquete: string) {
    const trimmed = paquete.trim();
    if (!trimmed) {
      throw new BadRequestException('Debe elegir un paquete');
    }
    const porCodigo = await this.productos.obtenerPorCodigo(trimmed);
    if (porCodigo?.categoria === CategoriaProducto.paquete) {
      if (porCodigo.etapa !== EtapaProducto.activo) {
        throw new BadRequestException('Paquete no disponible');
      }
      return porCodigo;
    }
    const paquetes = await this.productos.listar({
      soloActivos: true,
      categoria: CategoriaProducto.paquete,
    });
    const match = paquetes.find((p) => coincidePaquete(p.nombre, trimmed));
    if (!match) {
      throw new BadRequestException(`Paquete "${trimmed}" no encontrado`);
    }
    return match;
  }

  async armarCotizacionConPaquete(params: {
    paquete: string;
    fechaEvento: Date;
    cantidadNinos: number;
    seleccion: SeleccionPaqueteInput;
  }) {
    const paqueteProducto = await this.resolverPaquetePorNombreOCodigo(
      params.paquete,
    );
    const feriados = await this.calculo.obtenerFeriados();
    const esFinSemana = this.calculo.esTarifaFinSemana(
      params.fechaEvento,
      feriados,
    );
    const [reglasDb, productosDb] = await Promise.all([
      this.composicion.listarPorPaqueteId(paqueteProducto.id),
      this.productos.listarActivos(),
    ]);

    const productos = new Map(
      productosDb.map((p) => [p.id, this.aRef(p)] as const),
    );
    const reglas: ComposicionRegla[] = reglasDb.map((r) => ({
      modo: r.modo,
      cantidad: r.cantidad,
      montoCredito: r.montoCredito != null ? fromDecimal(r.montoCredito) : null,
      componenteId: r.componenteId,
      metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    }));

    const tarifas = await this.calculo.obtenerTarifas();
    const configCajitas = await this.calculo.obtenerReglasPaquete();

    const composicion = resolverComposicionPaquete({
      paquete: this.aRef(paqueteProducto),
      reglas,
      productos,
      seleccion: params.seleccion,
      esFinSemana,
      cajitasIncluidas: configCajitas.cajitasIncluidas,
      cajitasPrecioExcedente: configCajitas.cajitasPrecioExcedente,
    });

    const montos = this.calculo.calcular(
      tarifas,
      params.fechaEvento,
      params.cantidadNinos,
      composicion.itemsCobrables,
      feriados,
      { montoBasePaquete: composicion.montoBasePaquete },
    );

    return {
      paqueteProducto,
      composicion,
      montos,
      esFinSemana,
    };
  }
}
