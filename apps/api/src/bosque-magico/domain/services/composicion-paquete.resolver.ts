import {
  CategoriaProducto,
  ModoComposicionPaquete,
  OrigenItemCotizacion,
  SubtipoProducto,
} from '@prisma/client';
import {
  categoriaATipoItem,
  type ComposicionRegla,
  type ItemPaqueteResuelto,
  type ProductoCotizacionRef,
  precioProducto,
  type ResumenPaquete,
  type ResultadoComposicionPaquete,
  type SeleccionPaqueteInput,
} from './composicion-paquete.types';

const CAJITAS_INCLUIDAS_DEFAULT = 10;
const CAJITAS_PRECIO_EXCEDENTE_DEFAULT = 20.9;
const SNACK_PREMIUM_UNIDADES_INCLUIDAS_DEFAULT = 25;
const SNACK_PREMIUM_PRECIO_PACK_DEFAULT = 350;
const SNACK_PREMIUM_PRECIO_EXCEDENTE_UNIDAD_DEFAULT = 10;

export type ResolverComposicionInput = {
  paquete: ProductoCotizacionRef;
  reglas: ComposicionRegla[];
  productos: Map<string, ProductoCotizacionRef>;
  seleccion: SeleccionPaqueteInput;
  esFinSemana: boolean;
  cajitasIncluidas?: number;
  cajitasPrecioExcedente?: number;
  snackPremiumUnidadesIncluidas?: number;
  snackPremiumPrecioExcedente?: number;
  /** Override del crédito de piqueos (config `paquetes.piqueos_credito_premium`). */
  piqueosCreditoPremium?: number;
};

function itemIncluido(
  producto: ProductoCotizacionRef,
  cantidad: number,
  esFinSemana: boolean,
  notas?: string,
): ItemPaqueteResuelto {
  const precioCatalogo = precioProducto(producto, esFinSemana);
  return {
    productoId: producto.id,
    tipo: categoriaATipoItem(producto.categoria),
    nombre: producto.nombre,
    cantidad,
    precioUnitario: 0,
    precioCatalogo,
    origenItem: OrigenItemCotizacion.incluido_paquete,
    notas,
  };
}

function itemExcedente(
  producto: ProductoCotizacionRef,
  cantidad: number,
  precioUnitario: number,
  esFinSemana: boolean,
  notas?: string,
): ItemPaqueteResuelto {
  const precioCatalogo = precioProducto(producto, esFinSemana);
  return {
    productoId: producto.id,
    tipo: categoriaATipoItem(producto.categoria),
    nombre: producto.nombre,
    cantidad,
    precioUnitario,
    precioCatalogo,
    origenItem: OrigenItemCotizacion.excedente_paquete,
    notas,
  };
}

function itemAdicional(
  producto: ProductoCotizacionRef,
  cantidad: number,
  esFinSemana: boolean,
): ItemPaqueteResuelto {
  const precio = precioProducto(producto, esFinSemana);
  return {
    productoId: producto.id,
    tipo: categoriaATipoItem(producto.categoria),
    nombre: producto.nombre,
    cantidad,
    precioUnitario: precio,
    precioCatalogo: precio,
    origenItem: OrigenItemCotizacion.adicional,
  };
}

function resolverSlots(
  ids: string[] | undefined,
  cupoIncluido: number,
  productos: Map<string, ProductoCotizacionRef>,
  esFinSemana: boolean,
  categoriaEsperada: CategoriaProducto,
): ItemPaqueteResuelto[] {
  const items: ItemPaqueteResuelto[] = [];
  for (let i = 0; i < (ids?.length ?? 0); i++) {
    const id = ids![i];
    const producto = productos.get(id);
    if (!producto) continue;
    if (producto.categoria !== categoriaEsperada) continue;
    if (i < cupoIncluido) {
      items.push(
        itemIncluido(producto, 1, esFinSemana, 'Incluido en paquete'),
      );
    } else {
      items.push(itemAdicional(producto, 1, esFinSemana));
    }
  }
  return items;
}

function resolverCajitas(
  seleccion: SeleccionPaqueteInput,
  productos: Map<string, ProductoCotizacionRef>,
  esFinSemana: boolean,
  incluidasConfig: number,
  precioExcedente: number,
): {
  items: ItemPaqueteResuelto[];
  resumen: Pick<
    ResumenPaquete,
    'cajitasIncluidas' | 'cajitasSolicitadas' | 'cajitasExcedente'
  >;
} {
  const cajita = [...productos.values()].find(
    (p) => p.subtipo === SubtipoProducto.cajita,
  );
  const detallePorTipo =
    seleccion.cajitasClasica != null || seleccion.cajitasSaludable != null;
  let cajitasClasica = Math.max(seleccion.cajitasClasica ?? 0, 0);
  const cajitasSaludable = Math.max(seleccion.cajitasSaludable ?? 0, 0);
  let solicitadas = detallePorTipo
    ? cajitasClasica + cajitasSaludable
    : (seleccion.cajitasCantidad ?? incluidasConfig);
  solicitadas = Math.max(solicitadas, incluidasConfig);
  if (!detallePorTipo) {
    cajitasClasica = solicitadas;
  } else if (cajitasClasica + cajitasSaludable < solicitadas) {
    cajitasClasica += solicitadas - (cajitasClasica + cajitasSaludable);
  }
  const incluidas = Math.min(incluidasConfig, solicitadas);
  const excedente = Math.max(0, solicitadas - incluidasConfig);
  const items: ItemPaqueteResuelto[] = [];

  if (!cajita) {
    return {
      items,
      resumen: {
        cajitasIncluidas: incluidasConfig,
        cajitasSolicitadas: solicitadas,
        cajitasExcedente: excedente,
      },
    };
  }

  let incluidasRestantes = incluidas;
  const clasicaIncluida = Math.min(cajitasClasica, incluidasRestantes);
  incluidasRestantes -= clasicaIncluida;
  const saludableIncluida = Math.min(cajitasSaludable, incluidasRestantes);
  const clasicaExcedente = Math.max(0, cajitasClasica - clasicaIncluida);
  const saludableExcedente = Math.max(0, cajitasSaludable - saludableIncluida);

  if (clasicaIncluida > 0) {
    items.push(
      {
        ...itemIncluido(
          cajita,
          clasicaIncluida,
          esFinSemana,
          `${clasicaIncluida} incluidas en paquete`,
        ),
        nombre: `${cajita.nombre} Clásica`,
      },
    );
  }
  if (saludableIncluida > 0) {
    items.push(
      {
        ...itemIncluido(
          cajita,
          saludableIncluida,
          esFinSemana,
          `${saludableIncluida} incluidas en paquete`,
        ),
        nombre: `${cajita.nombre} Saludable`,
      },
    );
  }
  if (clasicaExcedente > 0) {
    items.push(
      {
        ...itemExcedente(
          cajita,
          clasicaExcedente,
          precioExcedente,
          esFinSemana,
          'Cajitas adicionales',
        ),
        nombre: `${cajita.nombre} Clásica`,
      },
    );
  }
  if (saludableExcedente > 0) {
    items.push(
      {
        ...itemExcedente(
          cajita,
          saludableExcedente,
          precioExcedente,
          esFinSemana,
          'Cajitas adicionales',
        ),
        nombre: `${cajita.nombre} Saludable`,
      },
    );
  }

  return {
    items,
    resumen: {
      cajitasIncluidas: incluidasConfig,
      cajitasSolicitadas: solicitadas,
      cajitasExcedente: excedente,
    },
  };
}

function resolverPiqueos(
  seleccion: SeleccionPaqueteInput,
  productos: Map<string, ProductoCotizacionRef>,
  esFinSemana: boolean,
  creditoIncluido: number,
): {
  items: ItemPaqueteResuelto[];
  resumen: Pick<
    ResumenPaquete,
    'piqueosCreditoIncluido' | 'piqueosValorSeleccionado' | 'piqueosExcedente'
  >;
} {
  const items: ItemPaqueteResuelto[] = [];
  let creditoRestante = creditoIncluido;
  let valorSeleccionado = 0;
  let excedente = 0;

  for (const entrada of seleccion.piqueos ?? []) {
    const producto = productos.get(entrada.productoId);
    if (!producto || producto.subtipo !== SubtipoProducto.piqueo) continue;
    const precioPack = precioProducto(producto, esFinSemana);
    for (let u = 0; u < entrada.cantidad; u++) {
      valorSeleccionado += precioPack;
      const creditoAplicado = Math.min(creditoRestante, precioPack);
      const precioExcedente = Math.max(precioPack - creditoAplicado, 0);
      if (precioExcedente <= 0) {
        items.push({
          ...itemIncluido(
            producto,
            1,
            esFinSemana,
            creditoIncluido > 0 ? 'Incluido en crédito de piqueos' : 'Incluido en paquete',
          ),
          creditoAplicado,
        });
        creditoRestante -= creditoAplicado;
      } else {
        items.push({
          ...itemExcedente(
            producto,
            1,
            precioExcedente,
            esFinSemana,
            creditoIncluido > 0
              ? 'Excede crédito de piqueos'
              : 'Piqueo adicional',
          ),
          creditoAplicado,
        });
        excedente += precioExcedente;
        creditoRestante = 0;
      }
    }
  }

  return {
    items,
    resumen: {
      piqueosCreditoIncluido: creditoIncluido,
      piqueosValorSeleccionado: valorSeleccionado,
      piqueosExcedente: excedente,
    },
  };
}

function resolverSnackPremium(
  regla: ComposicionRegla,
  seleccion: SeleccionPaqueteInput,
  productos: Map<string, ProductoCotizacionRef>,
  esFinSemana: boolean,
  overrides?: {
    unidadesIncluidas?: number;
    precioUnidadExcedente?: number;
  },
): {
  items: ItemPaqueteResuelto[];
  resumen: Pick<
    ResumenPaquete,
    | 'snackUnidadesIncluidas'
    | 'snackUnidadesSolicitadas'
    | 'snackUnidadesExcedente'
    | 'snackMontoExcedente'
  >;
} {
  const ids = (regla.metadata?.productoIds as string[] | undefined) ?? [];
  const elegido = seleccion.snackId;
  const unidadesIncluidas =
    overrides?.unidadesIncluidas ??
    (regla.metadata?.unidadesIncluidas as number | undefined) ??
    SNACK_PREMIUM_UNIDADES_INCLUIDAS_DEFAULT;
  const precioPack =
    (regla.metadata?.precioPack as number | undefined) ??
    SNACK_PREMIUM_PRECIO_PACK_DEFAULT;
  const precioUnidadExcedente =
    overrides?.precioUnidadExcedente ??
    (regla.metadata?.precioUnidadExcedente as number | undefined) ??
    SNACK_PREMIUM_PRECIO_EXCEDENTE_UNIDAD_DEFAULT;

  if (!elegido || !ids.includes(elegido)) {
    return {
      items: [],
      resumen: {
        snackUnidadesIncluidas: unidadesIncluidas,
        snackUnidadesSolicitadas: 0,
        snackUnidadesExcedente: 0,
        snackMontoExcedente: 0,
      },
    };
  }

  const producto = productos.get(elegido);
  if (!producto) {
    return {
      items: [],
      resumen: {
        snackUnidadesIncluidas: unidadesIncluidas,
        snackUnidadesSolicitadas: 0,
        snackUnidadesExcedente: 0,
        snackMontoExcedente: 0,
      },
    };
  }

  const solicitadas = Math.max(
    seleccion.snackCantidad ?? unidadesIncluidas,
    unidadesIncluidas,
  );
  const unidadesExcedente = Math.max(0, solicitadas - unidadesIncluidas);
  const montoExcedente = unidadesExcedente * precioUnidadExcedente;
  const items: ItemPaqueteResuelto[] = [
    {
      ...itemIncluido(
        producto,
        unidadesIncluidas,
        esFinSemana,
        `${unidadesIncluidas} unidades incluidas en carrito snack Premium`,
      ),
      precioCatalogo: precioPack,
    },
  ];
  if (unidadesExcedente > 0) {
    items.push(
      itemExcedente(
        producto,
        unidadesExcedente,
        precioUnidadExcedente,
        esFinSemana,
        `Excedente snack Premium (${unidadesExcedente} unidad(es) adicional(es))`,
      ),
    );
  }

  return {
    items,
    resumen: {
      snackUnidadesIncluidas: unidadesIncluidas,
      snackUnidadesSolicitadas: solicitadas,
      snackUnidadesExcedente: unidadesExcedente,
      snackMontoExcedente: montoExcedente,
    },
  };
}

function idsEnSeleccion(seleccion: SeleccionPaqueteInput): Set<string> {
  const ids = new Set<string>();
  for (const id of seleccion.showIds ?? []) ids.add(id);
  for (const id of seleccion.extraIds ?? []) ids.add(id);
  if (seleccion.snackId) ids.add(seleccion.snackId);
  for (const p of seleccion.piqueos ?? []) ids.add(p.productoId);
  return ids;
}

export function resolverComposicionPaquete(
  input: ResolverComposicionInput,
): ResultadoComposicionPaquete {
  const {
    paquete,
    reglas,
    productos,
    seleccion,
    esFinSemana,
    cajitasIncluidas = CAJITAS_INCLUIDAS_DEFAULT,
    cajitasPrecioExcedente = CAJITAS_PRECIO_EXCEDENTE_DEFAULT,
    snackPremiumUnidadesIncluidas = SNACK_PREMIUM_UNIDADES_INCLUIDAS_DEFAULT,
    snackPremiumPrecioExcedente =
      SNACK_PREMIUM_PRECIO_EXCEDENTE_UNIDAD_DEFAULT,
    piqueosCreditoPremium,
  } = input;

  const items: ItemPaqueteResuelto[] = [];
  let slotShow = 0;
  let slotExtra = 0;
  let creditoPiqueos = 0;
  let cajitasRegla = cajitasIncluidas;
  let snackResumen: Pick<
    ResumenPaquete,
    | 'snackUnidadesIncluidas'
    | 'snackUnidadesSolicitadas'
    | 'snackUnidadesExcedente'
    | 'snackMontoExcedente'
  > = {
    snackUnidadesIncluidas: 0,
    snackUnidadesSolicitadas: 0,
    snackUnidadesExcedente: 0,
    snackMontoExcedente: 0,
  };

  for (const regla of reglas) {
    switch (regla.modo) {
      case ModoComposicionPaquete.producto_fijo: {
        if (!regla.componenteId) break;
        const producto = productos.get(regla.componenteId);
        if (!producto) break;
        items.push(
          itemIncluido(
            producto,
            regla.cantidad,
            esFinSemana,
            'Incluido en paquete',
          ),
        );
        break;
      }
      case ModoComposicionPaquete.slot_show:
        slotShow = regla.cantidad;
        break;
      case ModoComposicionPaquete.slot_extra:
        slotExtra = regla.cantidad;
        break;
      case ModoComposicionPaquete.cajitas_incluidas:
        cajitasRegla = regla.cantidad;
        break;
      case ModoComposicionPaquete.credito_piqueos:
        creditoPiqueos =
          piqueosCreditoPremium ?? regla.montoCredito ?? 200;
        break;
      case ModoComposicionPaquete.eleccion_snack: {
        const snack = resolverSnackPremium(
          regla,
          seleccion,
          productos,
          esFinSemana,
          {
            unidadesIncluidas: snackPremiumUnidadesIncluidas,
            precioUnidadExcedente: snackPremiumPrecioExcedente,
          },
        );
        items.push(...snack.items);
        snackResumen = snack.resumen;
        break;
      }
      default:
        break;
    }
  }

  items.push(
    ...resolverSlots(
      seleccion.showIds,
      slotShow,
      productos,
      esFinSemana,
      CategoriaProducto.show,
    ),
  );
  items.push(
    ...resolverSlots(
      seleccion.extraIds,
      slotExtra,
      productos,
      esFinSemana,
      CategoriaProducto.extra,
    ),
  );

  const cajitas = resolverCajitas(
    seleccion,
    productos,
    esFinSemana,
    cajitasRegla,
    cajitasPrecioExcedente,
  );
  items.push(...cajitas.items);

  const piqueos = resolverPiqueos(
    seleccion,
    productos,
    esFinSemana,
    creditoPiqueos,
  );
  items.push(...piqueos.items);

  const yaUsados = idsEnSeleccion(seleccion);
  for (const adicional of seleccion.adicionales ?? []) {
    if (yaUsados.has(adicional.productoId)) continue;
    const producto = productos.get(adicional.productoId);
    if (!producto) continue;
    items.push(itemAdicional(producto, adicional.cantidad, esFinSemana));
  }

  const montoBasePaquete = precioProducto(paquete, esFinSemana);
  const itemsCobrables = items
    .filter((i) => i.precioUnitario > 0)
    .map((i) => ({ cantidad: i.cantidad, precioUnitario: i.precioUnitario }));

  return {
    paqueteId: paquete.id,
    paqueteNombre: paquete.nombre,
    montoBasePaquete,
    items,
    itemsCobrables,
    resumen: {
      ...cajitas.resumen,
      ...snackResumen,
      ...piqueos.resumen,
    },
  };
}
