import { INPUT_CLASS } from '../../constants/design';
import { formatFechaCalendario } from '../../lib/fecha-calendario';

type Props = {
  fechas: string[];
  onChange: (fechas: string[]) => void;
};

export function FeriadosConfigEditor({ fechas, onChange }: Props) {
  const agregar = (raw: string) => {
    const fecha = raw.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fechas.includes(fecha)) return;
    onChange([...fechas, fecha].sort());
  };

  const quitar = (fecha: string) => {
    onChange(fechas.filter((f) => f !== fecha));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[180px] flex-1">
          <span className="text-body-sm font-medium text-on-surface">Agregar fecha</span>
          <input
            type="date"
            className={`mt-1 w-full ${INPUT_CLASS}`}
            onChange={(e) => {
              if (e.target.value) agregar(e.target.value);
              e.target.value = '';
            }}
          />
        </label>
        {fechas.length > 0 && (
          <button
            type="button"
            className="h-[42px] shrink-0 px-3 text-body-sm font-semibold text-secondary hover:text-primary hover:underline"
            onClick={() => onChange([])}
          >
            Limpiar todas
          </button>
        )}
      </div>

      {fechas.length === 0 ? (
        <p className="text-body-sm text-outline">
          Sin feriados configurados. Sábados y domingos siguen usando tarifa fin de semana.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {fechas.map((fecha) => (
            <li
              key={fecha}
              className="inline-flex items-center gap-2 rounded-full border border-surface-variant bg-surface-container-low px-3 py-1 text-body-sm"
            >
              <span className="font-medium text-on-surface">{formatFechaCalendario(fecha)}</span>
              <span className="font-mono text-xs text-outline">{fecha}</span>
              <button
                type="button"
                className="text-outline hover:text-error"
                aria-label={`Quitar feriado ${fecha}`}
                onClick={() => quitar(fecha)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
