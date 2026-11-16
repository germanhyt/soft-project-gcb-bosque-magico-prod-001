import { EtapaCotizacion } from '@prisma/client';

/** Cotizaciones que aún no son evento y deben verse en la agenda. */
export const ETAPAS_COTIZACION_EN_CALENDARIO: readonly EtapaCotizacion[] = [
  EtapaCotizacion.borrador,
  EtapaCotizacion.enviada,
];

export function cotizacionVisibleEnCalendario(
  etapa: EtapaCotizacion | string,
): boolean {
  return (ETAPAS_COTIZACION_EN_CALENDARIO as readonly string[]).includes(etapa);
}

export type EntradaAgenda<E, C> = {
  fecha: string;
  eventos: E[];
  cotizaciones: C[];
};

export function fusionarAgendaPorFecha<E, C>(
  eventos: Array<{ fecha: string; item: E }>,
  cotizaciones: Array<{ fecha: string; item: C }>,
): EntradaAgenda<E, C>[] {
  const map = new Map<string, EntradaAgenda<E, C>>();
  const ensure = (fecha: string) => {
    let row = map.get(fecha);
    if (!row) {
      row = { fecha, eventos: [], cotizaciones: [] };
      map.set(fecha, row);
    }
    return row;
  };

  for (const evento of eventos) ensure(evento.fecha).eventos.push(evento.item);
  for (const cotizacion of cotizaciones) {
    ensure(cotizacion.fecha).cotizaciones.push(cotizacion.item);
  }

  return [...map.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
