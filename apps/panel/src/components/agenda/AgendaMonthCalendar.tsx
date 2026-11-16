import { useMemo } from 'react';
import { etiquetaTurno } from '@bosque/shared';
import type { CotizacionEnCalendario, Evento } from '../../lib/eventos';
import {
  WEEKDAY_LABELS,
  celdasMes,
  mesToParam,
  nombreMesAnio,
  parseMesParam,
} from '../../lib/agenda-calendar';
import {
  diaTieneCruceHorario,
  ocupantesParaCruce,
  textoChipCalendario,
} from '../../lib/cruce-calendario';
import { fechaCalendarioHoy } from '../../lib/fecha-calendario';
import { ETAPA_COT_BADGE, ETAPA_EVENTO_BADGE } from '../../constants/design';
import { ETAPA_COT_LABEL } from '../../constants/cotizaciones';
import { ETAPA_EVENTO_LABEL } from '../../constants/eventos';
import { Icon } from '../ui/Icon';

type Props = {
  mes: string;
  eventosPorFecha: Map<string, Evento[]>;
  cotizacionesPorFecha: Map<string, CotizacionEnCalendario[]>;
  diaSeleccionado?: string;
  onMesChange: (mes: string) => void;
  onDiaClick: (fecha: string) => void;
};

export function AgendaMonthCalendar({
  mes,
  eventosPorFecha,
  cotizacionesPorFecha,
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

      <p className="mb-3 flex flex-wrap items-center gap-2 text-body-sm text-outline">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ETAPA_COT_BADGE.borrador}`}>
          Borrador
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ETAPA_COT_BADGE.enviada}`}>
          Enviada
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ETAPA_EVENTO_BADGE.cancelado}`}>
          Cancelado
        </span>
        <span>El borrador ocupa el horario. El cancelado queda en rojo y no lo bloquea.</span>
      </p>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-surface-variant bg-surface-variant">
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
          const cotizaciones = cotizacionesPorFecha.get(celda.fecha) ?? [];
          const diaNum = Number(celda.fecha.slice(8, 10));
          const seleccionado = diaSeleccionado === celda.fecha;
          const tieneCruce = diaTieneCruceHorario(
            ocupantesParaCruce([
              ...eventos.map((ev) => ({
                etapa: ev.etapa,
                turno: ev.turno,
                inicio: ev.horarioInicio,
                fin: ev.horarioFin,
              })),
              ...cotizaciones.map((cot) => ({
                etapa: cot.etapa,
                turno: cot.turno,
                inicio: cot.horarioInicio,
                fin: cot.horarioFin,
              })),
            ]),
          );
          const chips = [
            ...eventos.map((ev) => ({
              id: ev.id,
              clase: ETAPA_EVENTO_BADGE[ev.etapa],
              texto: textoChipCalendario(ev.cliente.nombreCompleto, ETAPA_EVENTO_LABEL[ev.etapa]),
              title: `${ev.cliente.nombreCompleto} · ${etiquetaTurno(ev.turno, ev.horarioInicio, ev.horarioFin)} · ${ETAPA_EVENTO_LABEL[ev.etapa]}`,
            })),
            ...cotizaciones.map((cot) => ({
              id: cot.id,
              clase: ETAPA_COT_BADGE[cot.etapa],
              texto: textoChipCalendario(cot.cliente.nombreCompleto, ETAPA_COT_LABEL[cot.etapa]),
              title: `${cot.codigo} · ${cot.cliente.nombreCompleto} · ${etiquetaTurno(cot.turno, cot.horarioInicio, cot.horarioFin)} · ${ETAPA_COT_LABEL[cot.etapa]}`,
            })),
          ];
          return (
            <button
              key={celda.fecha}
              type="button"
              onClick={() => onDiaClick(celda.fecha)}
              className={`flex min-h-[88px] flex-col items-stretch bg-surface-container-lowest p-1.5 text-left transition hover:bg-surface-container-low sm:min-h-[100px] sm:p-2 ${
                !celda.enMes ? 'opacity-45' : ''
              } ${seleccionado ? 'ring-2 ring-inset ring-primary' : ''} ${
                celda.esHoy && celda.enMes ? 'bg-primary-fixed/15' : ''
              } ${tieneCruce ? 'ring-2 ring-inset ring-error' : ''}`}
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
                {tieneCruce && (
                  <span className="text-[10px] font-semibold text-error">Cruce de horario</span>
                )}
                {chips.slice(0, 3).map((chip) => (
                  <span
                    key={chip.id}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${chip.clase}`}
                    title={chip.title}
                  >
                    {chip.texto}
                  </span>
                ))}
                {chips.length > 3 && (
                  <span className="text-[10px] font-semibold text-outline">
                    +{chips.length - 3} más
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
