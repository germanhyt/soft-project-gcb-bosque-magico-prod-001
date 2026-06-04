import { useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  pending?: boolean;
  error?: string;
};

export function CancelarEventoModal({ open, onClose, onConfirm, pending, error }: Props) {
  const [motivo, setMotivo] = useState('');

  const handleClose = () => {
    setMotivo('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(motivo.trim());
  };

  return (
    <Modal open={open} onClose={handleClose} title="Cancelar evento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={LABEL_CLASS}>Motivo (opcional)</span>
          <input
            className={INPUT_CLASS}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. cliente reprogramó"
          />
        </label>
        {error && (
          <p className="rounded-lg bg-error-container/30 px-3 py-2 text-body-sm text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Volver
          </Button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-secondary px-5 py-2 text-body-sm font-semibold text-on-secondary disabled:opacity-60"
          >
            {pending ? 'Cancelando…' : 'Confirmar cancelación'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
