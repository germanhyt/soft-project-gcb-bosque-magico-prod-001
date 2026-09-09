export {
  claveFechaCalendarioIso,
  formatFechaCalendarioCorta,
  formatFechaCalendarioLarga,
  formatFechaDdMmYyyy,
} from './fecha-formato.js';
export {
  anexarHorarioANotas,
  formatearHorarioServicio,
  horariosConValor,
  parseHorarioDesdeNotas,
  textoHorarioEnNotas,
  type HorarioServicio,
} from './horario-servicio.js';
export {
  DURACION_TURNO_HORAS,
  esTurnoPersonalizado,
  etiquetaTurno,
  hayConflictoTurno,
  rangoTurnoPersonalizado,
  resolverHorarioTurno,
  solapanHorarios,
  sumarHoras,
  TURNO_PERSONALIZADO,
} from './turno-horario.js';
export {
  esExtraBloque,
  esUnidadPorHora,
  etiquetaCantidadExtra,
  etiquetaPrecioPorUnidad,
  unidadProductoNormalizada,
} from './producto-unidad.js';
export {
  itemsIncluidosPaquete,
  PAQUETE_INCLUSIONES_DEFAULT,
  type PaqueteInclusionesConfig,
} from './paquete-inclusiones.js';
export {
  buildCotizacionPrintHtml,
  filasTablaCotizacionPrint,
  type CotizacionPrintData,
  type CotizacionPrintEtapa,
  type CotizacionPrintOptions,
  type FilaPrintCotizacion,
} from './cotizacion-print.js';
export {
  buildContratoPrintHtml,
  buildContratoContext,
  contratoToPrintPayload,
  type ContratoFormDatos,
  type ContratoPrintPayload,
  type ContratoPrintOptions,
  type ContratoSnapshotJson,
  type TipoComprobante,
} from './contrato-print.js';
export {
  esProductoExtraPermitido,
  extrasPermitidosParaImpresion,
  nombresExtrasPermitidosDesdeCatalogo,
  nombresIgualesExtraPermitido,
  normalizarExtrasPermitidos,
  parseExtrasPermitidosJson,
} from './extras-permitidos.js';
export {
  CODIGOS_EXTRA_PERMITIDO_DEFAULT,
  CONTRATO_EXTRAS_COBRABLES_REFERENCIA,
  CONTRATO_EXTRAS_PERMITIDOS,
  CONTRATO_EXTRAS_PERMITIDOS_INTRO,
  CONTRATO_ESPACIO_INCLUYE,
  CONTRATO_TERMINOS_CLAUSULAS,
  CONTRATO_TERMINOS_VERSION,
  NOMBRE_ITEM_HORA_ADICIONAL_ESPACIO,
  NOMBRE_ITEM_INGRESO_CARRITO_SNACK_EXTERNO,
  NOMBRE_ITEM_INGRESO_DECORACION_EXTERNO,
  NOMBRE_ITEM_INGRESO_SHOW_EXTERNO,
  NOMBRE_ITEM_DERECHO_DECORACION_PERSONALIZADA,
  NOMBRE_ITEM_SALITA_LOUNGE,
} from './contrato-terminos.js';
