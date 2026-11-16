import { Link } from 'react-router-dom';
import { etiquetaTurno } from '@bosque/shared';
import { Modal } from '../ui/Modal';
import { EventoListCard } from './EventoListCard';
import { ETAPA_COT_BADGE } from '../../constants/design';
import { ETAPA_COT_LABEL } from '../../constants/cotizaciones';
import { diaTieneCruceHorario, ocupantesParaCruce } from '../../lib/cruce-calendario';
import type { CotizacionEnCalendario, Evento } from '../../lib/eventos';
import { formatFecha } from '../../lib/format';

type Props = {
  open: boolean;
  fecha: string;
  eventos: Evento[];
  cotizaciones: CotizacionEnCalendario[];
  selectedId?: string;
  onClose: () => void;
  onSelectEvento: (evento: Evento) => void;
};

export function AgendaDiaModal({
  open,
  fecha,
  eventos,
  cotizaciones,
  selectedId,
  onClose,
  onSelectEvento,
}: Props) {
  const count = eventos.length + cotizaciones.length;
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={formatFecha(fecha)}
      description={
        count === 0
          ? 'Sin ocupación este día'
          : `${count} en el día${tieneCruce ? ' · cruce de horario' : ''}`
      }
      size="lg"
    >
      {count === 0 ? (
        <p className="text-on-surface-variant">No hay eventos ni cotizaciones en curso para esta fecha.</p>
      ) : (
        <div className="space-y-6">
          {tieneCruce && (
            <p className="rounded-lg border border-error/30 bg-error-container/40 px-3 py-2 text-body-sm text-error">
              Hay un cruce de día u horario. Revisa el turno antes de seguir con otra cotización.
            </p>
          )}
          {eventos.length > 0 && (
            <section>
              <h3 className="mb-2 text-label-caps text-outline">Eventos</h3>
              <ul className="space-y-3">
                {eventos.map((ev) => (
                  <li key={ev.id}>
                    <EventoListCard
                      evento={ev}
                      selected={selectedId === ev.id}
                      onClick={() => onSelectEvento(ev)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {cotizaciones.length > 0 && (
            <section>
              <h3 className="mb-2 text-label-caps text-outline">Cotizaciones en curso</h3>
              <ul className="space-y-3">
                {cotizaciones.map((cot) => (
                  <li key={cot.id}>
                    <Link
                      to={`/cotizaciones/${cot.id}`}
                      className="block rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 transition hover:bg-surface-container-low"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-on-surface">
                          {cot.cliente.nombreCompleto}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ETAPA_COT_BADGE[cot.etapa]}`}>
                          {ETAPA_COT_LABEL[cot.etapa]}
                        </span>
                      </div>
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        {cot.codigo} · {etiquetaTurno(cot.turno, cot.horarioInicio, cot.horarioFin)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
