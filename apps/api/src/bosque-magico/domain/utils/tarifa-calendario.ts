import { esFechaCalendario, claveFechaCalendario } from './fecha-calendario';

/** Lista ordenada de fechas YYYY-MM-DD desde configuración. */
export function parseFeriadosConfig(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const fechas = valor.filter(
    (v): v is string => typeof v === 'string' && esFechaCalendario(v.trim()),
  );
  return [...new Set(fechas.map((f) => f.trim()))].sort();
}

export function feriadosComoSet(valor: unknown): Set<string> {
  return new Set(parseFeriadosConfig(valor));
}

/** Sábado, domingo o fecha en lista de feriados → tarifa fin de semana. */
export function esTarifaFinSemana(
  fecha: Date | string,
  feriados: ReadonlySet<string>,
): boolean {
  const clave =
    typeof fecha === 'string'
      ? esFechaCalendario(fecha.trim())
        ? fecha.trim()
        : claveFechaCalendario(fecha)
      : claveFechaCalendario(fecha);

  if (feriados.has(clave)) return true;

  const d = new Date(`${clave}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}
