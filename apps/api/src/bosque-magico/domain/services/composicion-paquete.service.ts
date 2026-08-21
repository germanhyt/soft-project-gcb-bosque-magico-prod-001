import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CategoriaProducto,
  EtapaProducto,
  OrigenItemCotizacion,
  TipoItemCotizacion,
  type BosqueMagicoProducto,
} from '@prisma/client';
import { CalculoPreciosService } from './calculo-precios.service';
import { resolverComposicionPaquete } from './composicion-paquete.resolver';
import { calcularCargosCapacidad } from './reglas-capacidad';
import { validarSeleccionPaquete } from './validar-seleccion-paquete';
import {
  coincidePaquete,
  type ComposicionRegla,
  type ItemPaqueteResuelto,
  type ProductoCotizacionRef,
  type SeleccionPaqueteInput,
} from './composicion-paquete.types';
import { fromDecimal } from '../utils/decimal';
import { ComposicionPaqueteRepository } from '../../infrastructure/repositories/composicion-paquete.repository';
import { ProductosRepository } from '../../infrastructure/repositories/productos.repository';

/** Nombres alineados con packages/shared contrato-terminos (hidratación panel). */
const NOMBRE_ITEM_HORA_ADICIONAL_ESPACIO = 'Hora adicional de espacio';
const NOMBRE_ITEM_SALITA_LOUNGE = 'Salita lounge (8 pax)';
const NOMBRE_ITEM_INGRESO_SHOW_EXTERNO = 'Derecho de ingreso de show externo';
const NOMBRE_ITEM_INGRESO_DECORACION_EXTERNO =
  'Derecho de ingreso de decoración externo';
const NOMBRE_ITEM_INGRESO_CARRITO_SNACK_EXTERNO =
  'Derecho de ingreso de carrito snack externo';

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
    horasAdicionales?: number;
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
    validarSeleccionPaquete(params.seleccion, productos);
    const reglas: ComposicionRegla[] = reglasDb.map((r) => ({
      modo: r.modo,
      cantidad: r.cantidad,
      montoCredito: r.montoCredito != null ? fromDecimal(r.montoCredito) : null,
      componenteId: r.componenteId,
      metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    }));

    const [tarifas, reglasCapacidad, configPaquete, tarifasHoraExtraEspacio, tarifasExtras] =
      await Promise.all([
        this.calculo.obtenerTarifas(),
        this.calculo.obtenerReglasCapacidad(),
        this.calculo.obtenerReglasPaquete(),
        this.calculo.obtenerTarifasHoraExtraEspacio(),
        this.calculo.obtenerTarifasExtrasInstitucionales(),
      ]);

    const composicion = resolverComposicionPaquete({
      paquete: this.aRef(paqueteProducto),
      reglas,
      productos,
      seleccion: params.seleccion,
      esFinSemana,
      cajitasIncluidas: configPaquete.cajitasIncluidas,
      cajitasPrecioExcedente: configPaquete.cajitasPrecioExcedente,
      snackPremiumUnidadesIncluidas:
        configPaquete.snackPremiumUnidadesIncluidas,
      snackPremiumPrecioExcedente: configPaquete.snackPremiumPrecioExcedente,
      piqueosCreditoPremium: configPaquete.piqueosCreditoPremium,
    });

    const cargosCapacidad = calcularCargosCapacidad({
      cantidadNinos: params.cantidadNinos,
      maximoPermitido: tarifas.maximoPermitido,
      ninosIncluidos: reglasCapacidad.ninosIncluidos,
      precioNinoExtra: reglasCapacidad.precioNinoExtra,
      seleccion: params.seleccion,
    });

    composicion.items.push(...cargosCapacidad.items);

    const pushExtra = (
      nombre: string,
      cantidad: number,
      precioUnitario: number,
      notas: string,
    ) => {
      if (cantidad <= 0 || precioUnitario < 0) return;
      const item: ItemPaqueteResuelto = {
        tipo: TipoItemCotizacion.extra,
        nombre,
        cantidad,
        precioUnitario,
        precioCatalogo: precioUnitario,
        origenItem: OrigenItemCotizacion.adicional,
        notas,
      };
      composicion.items.push(item);
      composicion.itemsCobrables.push({ cantidad, precioUnitario });
    };

    const horasAdicionales = Math.max(0, params.horasAdicionales ?? 0);
    if (horasAdicionales > 0) {
      const tarifaHora = esFinSemana
        ? tarifasHoraExtraEspacio.finSemana
        : tarifasHoraExtraEspacio.lunesViernes;
      pushExtra(
        NOMBRE_ITEM_HORA_ADICIONAL_ESPACIO,
        horasAdicionales,
        tarifaHora,
        `Horario extra del espacio (${horasAdicionales} hora(s))`,
      );
    }

    const salitaLoungeCantidad = Math.max(
      0,
      params.seleccion.salitaLoungeCantidad ?? 0,
    );
    pushExtra(
      NOMBRE_ITEM_SALITA_LOUNGE,
      salitaLoungeCantidad,
      tarifasExtras.salitaLounge,
      'Mobiliario lounge para 8 pax',
    );

    if (params.seleccion.derechoIngresoShowExterno) {
      pushExtra(
        NOMBRE_ITEM_INGRESO_SHOW_EXTERNO,
        1,
        tarifasExtras.ingresoShowExterno,
        'Derecho de ingreso show externo',
      );
    }
    if (params.seleccion.derechoIngresoDecoracionExterno) {
      pushExtra(
        NOMBRE_ITEM_INGRESO_DECORACION_EXTERNO,
        1,
        tarifasExtras.ingresoDecoracionExterno,
        'Derecho de ingreso decoración externo',
      );
    }
    if (params.seleccion.derechoIngresoCarritoSnackExterno) {
      pushExtra(
        NOMBRE_ITEM_INGRESO_CARRITO_SNACK_EXTERNO,
        1,
        tarifasExtras.ingresoCarritoSnackExterno,
        'Derecho de ingreso carrito snack externo',
      );
    }

    const montos = this.calculo.calcular(
      tarifas,
      params.fechaEvento,
      params.cantidadNinos,
      composicion.itemsCobrables,
      feriados,
      {
        montoBasePaquete: composicion.montoBasePaquete,
        montoNinosExtra: cargosCapacidad.montoTotal,
      },
    );

    return {
      paqueteProducto,
      composicion,
      montos,
      esFinSemana,
    };
  }
}
