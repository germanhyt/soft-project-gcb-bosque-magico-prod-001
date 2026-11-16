import { hayConflictoTurno } from '@bosque/shared';

export type SlotHorario = {
  turno: string;
  inicio?: string | null;
  fin?: string | null;
};

/** El cancelado sigue en el calendario, pero no ocupa el horario. */
export function ocupantesParaCruce<T extends SlotHorario & { etapa?: string }>(
  items: T[],
): SlotHorario[] {
  return items
    .filter((item) => item.etapa !== 'cancelado')
    .map(({ turno, inicio, fin }) => ({ turno, inicio, fin }));
}

export function textoChipCalendario(nombre: string, estado: string): string {
  const corto = nombre.trim().split(/\s+/)[0] || nombre.trim();
  return `${corto} · ${estado}`;
}

/** true si dos ocupantes del mismo día se pisan en turno u horario. */
export function diaTieneCruceHorario(slots: SlotHorario[]): boolean {
  if (slots.length < 2) return false;
  return slots.some((slot, index) =>
    hayConflictoTurno(
      { turno: slot.turno, inicio: slot.inicio, fin: slot.fin },
      slots
        .filter((_, i) => i !== index)
        .map((ocupado) => ({
          turno: ocupado.turno,
          inicio: ocupado.inicio,
          fin: ocupado.fin,
        })),
    ),
  );
}
