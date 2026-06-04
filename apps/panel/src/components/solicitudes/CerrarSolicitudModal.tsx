import { useState } from 'react';
import { MOTIVO_CIERRE_LABEL } from '../../constants/solicitudes';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import type { MotivoCierre } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: MotivoCierre, notas?: string) => void;
  pending?: boolean;
  error?: string;
  avisoCotizaciones?: string;
};

const MOTIVOS = Object.entries(MOTIVO_CIERRE_LABEL) as [MotivoCierre, string][];

export function CerrarSolicitudModal({
  open,
  onClose,
  onConfirm,
  pending,
  error,
  avisoCotizaciones,
}: Props) {
  const [motivo, setMotivo] = useState<MotivoCierre | ''>('');
  const [notas, setNotas] = useState('');

  const handleClose = () => {
    setMotivo('');
    setNotas('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo) onConfirm(motivo, notas.trim() || undefined);
  };

  return (
    <Modal open={open} onClose={handleClose} title="Cerrar solicitud">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={LABEL_CLASS}>Motivo de cierre *</span>
          <select
            className={INPUT_CLASS}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoCierre)}
            required
          >
            <option value="">Seleccionar…</option>
            {MOTIVOS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Comentario (opcional)</span>
          <textarea
            rows={3}
            className={INPUT_CLASS}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Detalle libre: por qué no continúa, referencia interna…"
          />
        </label>
        {avisoCotizaciones && (
          <p className="rounded-lg border border-tertiary-fixed/50 bg-tertiary-fixed/25 px-3 py-2 text-body-sm text-on-surface-variant">
            {avisoCotizaciones}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-error-container/30 px-3 py-2 text-body-sm text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <button
            type="submit"
            disabled={!motivo || pending}
            className="rounded-lg bg-secondary px-5 py-2 text-body-sm font-semibold text-on-secondary disabled:opacity-60"
          >
            {pending ? 'Cerrando…' : 'Cerrar solicitud'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
