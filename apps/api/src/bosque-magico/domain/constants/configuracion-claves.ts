/** Claves numéricas editables desde el panel (tarifas y límites). */
export const CLAVES_NUMERICAS_EDITABLES = new Set([
  'tarifas.base_lunes_viernes',
  'tarifas.base_fin_semana',
  'espacio.hora_extra_lunes_viernes',
  'espacio.hora_extra_fin_semana',
  'ninos.minimo',
  'ninos.maximo_base',
  'ninos.maximo_permitido',
  'shows.ninos_incluidos',
  'shows.precio_nino_extra',
  'extras.salita_lounge',
  'extras.ingreso_show_externo',
  'extras.ingreso_decoracion_externo',
  'extras.ingreso_carrito_snack_externo',
  'contrato.adelanto_referencial',
  'contrato.garantia_referencial',
  'catering.minimo_unidades',
  'solicitud.min_dias_anticipacion',
  'paquetes.cajitas_incluidas',
  'paquetes.cajitas_precio_excedente',
  'paquetes.piqueos_credito_premium',
  'paquetes.snack_premium_unidades_incluidas',
  'paquetes.snack_premium_precio_excedente',
  'smtp.port',
  'recordatorios.dias_antes',
]);

/** Claves obsoletas que ya no se usan en cálculo ni panel; se eliminan en seed. */
export const CLAVES_CONFIG_DEPRECADAS = [
  'tarifas.precio_nino_extra',
  'extras.precio_nino_extra',
] as const;
