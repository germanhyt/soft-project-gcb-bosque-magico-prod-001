import { useEffect, useState } from 'react';
import { apiErrorMessage } from '../../lib/api-error';
import type { ActualizarClientePayload, ClienteDetalle } from '../../lib/clientes';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type Props = {
  open: boolean;
  cliente?: ClienteDetalle | null;
  onClose: () => void;
  onSubmit: (payload: ActualizarClientePayload) => Promise<void>;
};

type FormState = {
  nombreCompleto: string;
  celular: string;
  tipoDocumento: '' | 'dni' | 'ruc' | 'otro';
  numeroDocumento: string;
  correo: string;
  direccion: string;
  distrito: string;
  notas: string;
};

const EMPTY: FormState = {
  nombreCompleto: '',
  celular: '',
  tipoDocumento: '',
  numeroDocumento: '',
  correo: '',
  direccion: '',
  distrito: '',
  notas: '',
};

function fromCliente(cliente: ClienteDetalle): FormState {
  return {
    nombreCompleto: cliente.nombreCompleto ?? '',
    celular: cliente.celular ?? '',
    tipoDocumento: cliente.tipoDocumento ?? '',
    numeroDocumento: cliente.numeroDocumento ?? '',
    correo: cliente.correo ?? '',
    direccion: cliente.direccion ?? '',
    distrito: cliente.distrito ?? '',
    notas: cliente.notas ?? '',
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function ClienteFormModal({ open, cliente, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !cliente) return;
    setForm(fromCliente(cliente));
    setPending(false);
    setError('');
  }, [open, cliente]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    if (!form.nombreCompleto.trim() || !form.celular.trim()) {
      setError('Nombre completo y celular son obligatorios.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit({
        nombreCompleto: form.nombreCompleto.trim(),
        celular: form.celular.trim(),
        tipoDocumento: form.tipoDocumento || undefined,
        numeroDocumento: optionalText(form.numeroDocumento),
        correo: optionalText(form.correo),
        direccion: optionalText(form.direccion),
        distrito: optionalText(form.distrito),
        notas: optionalText(form.notas),
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar el cliente'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar cliente" size="lg">
      {!cliente ? (
        <p className="text-on-surface-variant">Cargando datos del cliente…</p>
      ) : (
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Nombre completo *</span>
          <input
            className={INPUT_CLASS}
            value={form.nombreCompleto}
            onChange={(e) => setForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))}
            placeholder="Ej. Ana Pérez López"
          />
        </label>

        <label className="block">
          <span className={LABEL_CLASS}>Celular *</span>
          <input
            className={INPUT_CLASS}
            value={form.celular}
            onChange={(e) => setForm((prev) => ({ ...prev, celular: e.target.value }))}
            placeholder="999 888 777"
          />
        </label>

        <label className="block">
          <span className={LABEL_CLASS}>Correo</span>
          <input
            type="email"
            className={INPUT_CLASS}
            value={form.correo}
            onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
            placeholder="cliente@correo.com"
          />
        </label>

        <label className="block">
          <span className={LABEL_CLASS}>Tipo documento</span>
          <select
            className={INPUT_CLASS}
            value={form.tipoDocumento}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tipoDocumento: e.target.value as FormState['tipoDocumento'],
              }))
            }
          >
            <option value="">Sin documento</option>
            <option value="dni">DNI</option>
            <option value="ruc">RUC</option>
            <option value="otro">Otro</option>
          </select>
        </label>

        <label className="block">
          <span className={LABEL_CLASS}>Nro. documento</span>
          <input
            className={INPUT_CLASS}
            value={form.numeroDocumento}
            onChange={(e) => setForm((prev) => ({ ...prev, numeroDocumento: e.target.value }))}
            placeholder="12345678"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Dirección</span>
          <input
            className={INPUT_CLASS}
            value={form.direccion}
            onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
            placeholder="Av. Principal 123"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Distrito</span>
          <input
            className={INPUT_CLASS}
            value={form.distrito}
            onChange={(e) => setForm((prev) => ({ ...prev, distrito: e.target.value }))}
            placeholder="Surco"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Notas</span>
          <textarea
            rows={3}
            className={INPUT_CLASS}
            value={form.notas}
            onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
            placeholder="Preferencias o comentarios internos"
          />
        </label>

        {error && (
          <p className="sm:col-span-2 rounded-lg bg-error-container/30 px-3 py-2 text-body-sm text-error">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {pending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
      )}
    </Modal>
  );
}
