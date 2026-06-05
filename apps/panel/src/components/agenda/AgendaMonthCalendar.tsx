import { useMemo } from 'react';
import type { Evento } from '../../lib/eventos';
import {
  WEEKDAY_LABELS,
  celdasMes,
  mesToParam,
  nombreMesAnio,
  parseMesParam,
} from '../../lib/agenda-calendar';
import { fechaCalendarioHoy } from '../../lib/fecha-calendario';
import { ETAPA_EVENTO_BADGE } from '../../constants/design';
import { ETAPA_EVENTO_LABEL } from '../../constants/eventos';
import { Icon } from '../ui/Icon';

type Props = {
  mes: string;
  eventosPorFecha: Map<string, Evento[]>;
  diaSeleccionado?: string;
  onMesChange: (mes: string) => void;
  onDiaClick: (fecha: string) => void;
};

export function AgendaMonthCalendar({
  mes,
  eventosPorFecha,
  diaSeleccionado,
  onMesChange,
  onDiaClick,
}: Props) {
  const { year, month } = parseMesParam(mes);
  const celdas = useMemo(() => celdasMes(year, month), [year, month]);

  const irMes = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onMesChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-surface-variant pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => irMes(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-variant text-primary transition hover:bg-surface-container-low"
            aria-label="Mes anterior"
          >
            <Icon name="chevron_left" size={22} filled={false} />
          </button>
          <h2 className="min-w-[10rem] text-center text-title-md text-primary">
            {nombreMesAnio(year, month)}
          </h2>
          <button
            type="button"
            onClick={() => irMes(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-variant text-primary transition hover:bg-surface-container-low"
            aria-label="Mes siguiente"
          >
            <Icon name="chevron_right" size={22} filled={false} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            const hoy = fechaCalendarioHoy();
            const [y, m] = hoy.split('-').map(Number);
            onMesChange(mesToParam(y, m - 1));
          }}
          className="rounded-full border border-surface-variant px-4 py-1.5 text-body-sm font-semibold text-primary transition hover:bg-surface-container-low"
        >
          Hoy
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-xl border border-surface-variant bg-surface-variant overflow-hidden">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="bg-surface-container-high px-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-outline"
          >
            {d}
          </div>
        ))}
        {celdas.map((celda) => {
          const eventos = eventosPorFecha.get(celda.fecha) ?? [];
          const diaNum = Number(celda.fecha.slice(8, 10));
          const seleccionado = diaSeleccionado === celda.fecha;
          return (
            <button
              key={celda.fecha}
              type="button"
              onClick={() => onDiaClick(celda.fecha)}
              className={`flex min-h-[88px] flex-col items-stretch bg-surface-container-lowest p-1.5 text-left transition hover:bg-surface-container-low sm:min-h-[100px] sm:p-2 ${
                !celda.enMes ? 'opacity-45' : ''
              } ${seleccionado ? 'ring-2 ring-inset ring-primary' : ''} ${
                celda.esHoy && celda.enMes ? 'bg-primary-fixed/15' : ''
              }`}
            >
              <span
                className={`mb-1 flex h-7 w-7 items-center justify-center self-end rounded-full text-body-sm font-semibold ${
                  celda.esHoy && celda.enMes
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant'
                }`}
              >
                {diaNum}
              </span>
              <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {eventos.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${ETAPA_EVENTO_BADGE[ev.etapa]}`}
                    title={`${ev.cliente.nombreCompleto} · ${ETAPA_EVENTO_LABEL[ev.etapa]}`}
                  >
                    {ev.cliente.nombreCompleto.split(' ')[0]}
                  </span>
                ))}
                {eventos.length > 3 && (
                  <span className="text-[10px] font-semibold text-outline">
                    +{eventos.length - 3} más
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
