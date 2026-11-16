import { hayConflictoTurno } from '@bosque/shared';

export type SlotHorario = {
  turno: string;
  inicio?: string | null;
  fin?: string | null;
};

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
