import { Modal } from '../ui/Modal';
import { EventoListCard } from './EventoListCard';
import type { Evento } from '../../lib/eventos';
import { formatFecha } from '../../lib/format';

type Props = {
  open: boolean;
  fecha: string;
  eventos: Evento[];
  selectedId?: string;
  onClose: () => void;
  onSelectEvento: (evento: Evento) => void;
};

export function AgendaDiaModal({
  open,
  fecha,
  eventos,
  selectedId,
  onClose,
  onSelectEvento,
}: Props) {
  const count = eventos.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={formatFecha(fecha)}
      description={
        count === 0
          ? 'Sin eventos este día'
          : `${count} evento${count === 1 ? '' : 's'}`
      }
      size="lg"
    >
      {count === 0 ? (
        <p className="text-on-surface-variant">No hay eventos programados para esta fecha.</p>
      ) : (
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
      )}
    </Modal>
  );
}
