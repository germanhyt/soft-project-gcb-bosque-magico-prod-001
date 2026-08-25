/** Ítems incluidos por paquete (descriptivo para cotización / landing). */

export type PaqueteInclusionesConfig = {
  cajitasIncluidas: number;
  piqueosCreditoPremium: number;
  snackUnidadesIncluidas: number;
};

export const PAQUETE_INCLUSIONES_DEFAULT: PaqueteInclusionesConfig = {
  cajitasIncluidas: 10,
  piqueosCreditoPremium: 200,
  snackUnidadesIncluidas: 25,
};

function normalizarPaquete(paquete: string): string {
  return paquete
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function itemsIncluidosPaquete(
  paquete: string,
  config: PaqueteInclusionesConfig = PAQUETE_INCLUSIONES_DEFAULT,
): string[] {
  if (!paquete.trim()) return [];
  const n = normalizarPaquete(paquete);
  const cajitas = `${config.cajitasIncluidas} cajitas Bosque Mágico`;
  const extra = '1 servicio extra a elegir';
  const alquiler = 'Alquiler 3 horas';

  if (n.includes('premiu')) {
    return [
      alquiler,
      'Asistente de evento (bloque 3 h)',
      '1 show incluido',
      extra,
      `Carrito snack (${config.snackUnidadesIncluidas} unidades incluidas)`,
      `Crédito S/ ${config.piqueosCreditoPremium} en piqueos`,
      cajitas,
    ];
  }
  if (n.includes('estandar') || n.includes('standar')) {
    return [alquiler, '1 show incluido', extra, cajitas];
  }
  if (n.includes('personal')) {
    return [alquiler, extra, cajitas, 'Show personalizado (costo adicional)'];
  }
  return [alquiler, extra, cajitas];
}
