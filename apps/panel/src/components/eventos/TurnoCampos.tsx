import { rangoTurnoPersonalizado, TURNO_PERSONALIZADO } from '@bosque/shared';
import { TURNOS, TURNO_LABEL } from '../../constants/solicitudes';
import { LABEL_CLASS, INPUT_CLASS } from '../../constants/design';

type Props = {
  turno: string;
  horarioInicio: string;
  onTurno: (turno: string) => void;
  onHorarioInicio: (inicio: string) => void;
  allowEmpty?: boolean;
  required?: boolean;
  name?: string;
  className?: string;
  onBlur?: () => void;
};

export function TurnoCampos({
  turno,
  horarioInicio,
  onTurno,
  onHorarioInicio,
  allowEmpty = false,
  required = false,
  name = 'turno',
  className = '',
  onBlur,
}: Props) {
  const personalizado = turno === TURNO_PERSONALIZADO;
  const rango = personalizado ? rangoTurnoPersonalizado(horarioInicio) : undefined;

  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      <label className="block">
        <span className={LABEL_CLASS}>
          Turno{required ? ' *' : ''}
        </span>
        <select
          name={name}
          className={INPUT_CLASS}
          value={turno}
          onChange={(e) => onTurno(e.target.value)}
          onBlur={onBlur}
        >
          {allowEmpty ? <option value="">Sin turno</option> : null}
          {TURNOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      {personalizado ? (
        <label className="block">
          <span className={LABEL_CLASS}>Inicio (3 h){required ? ' *' : ''}</span>
          <input
            type="time"
            className={INPUT_CLASS}
            value={horarioInicio}
            onChange={(e) => onHorarioInicio(e.target.value)}
            onBlur={onBlur}
          />
          <span className="mt-1 block text-xs text-on-surface-variant">
            {rango
              ? `Rango: ${rango.inicio} – ${rango.fin}`
              : 'Elige la hora de inicio; el turno dura 3 horas.'}
          </span>
        </label>
      ) : null}
    </div>
  );
}

export function etiquetaTurnoPanel(
  turno?: string | null,
  horarioInicio?: string | null,
  horarioFin?: string | null,
): string {
  if (!turno) return '—';
  if (turno === TURNO_PERSONALIZADO) {
    if (horarioInicio && horarioFin) {
      return `Personalizado (${horarioInicio}–${horarioFin})`;
    }
    return TURNO_LABEL[turno] ?? 'Turno personalizado';
  }
  return TURNO_LABEL[turno] ?? turno;
}
