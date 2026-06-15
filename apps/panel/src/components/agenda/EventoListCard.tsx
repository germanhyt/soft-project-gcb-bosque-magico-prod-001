import { EventoBadge } from '../eventos/EventoBadge';
import { ETAPA_EVENTO_CARD } from '../../constants/design';
import { TURNO_LABEL } from '../../constants/solicitudes';
import type { Evento } from '../../lib/eventos';

type Props = {
  evento: Evento;
  selected?: boolean;
  onClick: () => void;
  showMonto?: boolean;
};

export function EventoListCard({ evento, selected, onClick, showMonto }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border border-surface-variant bg-surface-container-lowest p-4 text-left tactile-card ${ETAPA_EVENTO_CARD[evento.etapa]} ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-on-surface">{evento.cliente.nombreCompleto}</span>
        <EventoBadge etapa={evento.etapa} />
      </div>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        {TURNO_LABEL[evento.turno] ?? evento.turno} · {evento.cantidadNinos} niños
        {showMonto ? ` · S/ ${evento.montoTotal.toFixed(2)}` : ''}
      </p>
      {showMonto && (
        <p className="text-body-sm text-outline">
          {evento.cumpleanero.nombre}
          {evento.cotizacion ? ` · ${evento.cotizacion.codigo}` : ''}
        </p>
      )}
    </button>
  );
}
