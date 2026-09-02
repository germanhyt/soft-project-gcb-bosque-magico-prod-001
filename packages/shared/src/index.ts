export { formatFechaDdMmYyyy } from './fecha-formato';
export {
  anexarHorarioANotas,
  formatearHorarioServicio,
  horariosConValor,
  parseHorarioDesdeNotas,
  textoHorarioEnNotas,
  type HorarioServicio,
} from './horario-servicio';
export {
  esExtraBloque,
  esUnidadPorHora,
  etiquetaCantidadExtra,
  etiquetaPrecioPorUnidad,
  unidadProductoNormalizada,
} from './producto-unidad';
export {
  itemsIncluidosPaquete,
  PAQUETE_INCLUSIONES_DEFAULT,
  type PaqueteInclusionesConfig,
} from './paquete-inclusiones';
export {
  buildCotizacionPrintHtml,
  filasTablaCotizacionPrint,
  type CotizacionPrintData,
  type CotizacionPrintEtapa,
  type CotizacionPrintOptions,
  type FilaPrintCotizacion,
} from './cotizacion-print';
export {
  buildContratoPrintHtml,
  buildContratoContext,
  contratoToPrintPayload,
  type ContratoFormDatos,
  type ContratoPrintPayload,
  type ContratoPrintOptions,
  type ContratoSnapshotJson,
  type TipoComprobante,
} from './contrato-print';
export {
  CONTRATO_EXTRAS_COBRABLES_REFERENCIA,
  CONTRATO_EXTRAS_PERMITIDOS,
  CONTRATO_ESPACIO_INCLUYE,
  CONTRATO_TERMINOS_CLAUSULAS,
  CONTRATO_TERMINOS_VERSION,
  NOMBRE_ITEM_HORA_ADICIONAL_ESPACIO,
  NOMBRE_ITEM_INGRESO_CARRITO_SNACK_EXTERNO,
  NOMBRE_ITEM_INGRESO_DECORACION_EXTERNO,
  NOMBRE_ITEM_INGRESO_SHOW_EXTERNO,
  NOMBRE_ITEM_DERECHO_DECORACION_PERSONALIZADA,
  NOMBRE_ITEM_SALITA_LOUNGE,
} from './contrato-terminos';
