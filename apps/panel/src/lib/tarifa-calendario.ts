/** Utilidades de tarifa por calendario (feriados + fin de semana). */

export function parseFeriadosConfig(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const fechas = valor.filter(
    (v): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()),
  );
  return [...new Set(fechas.map((f) => f.trim()))].sort();
}

export function esTarifaFinSemana(fecha: string, feriados: readonly string[]): boolean {
  if (!fecha) return false;
  const clave = fecha.slice(0, 10);
  if (feriados.includes(clave)) return true;
  const day = new Date(`${clave}T12:00:00`).getDay();
  return day === 0 || day === 6;
}
