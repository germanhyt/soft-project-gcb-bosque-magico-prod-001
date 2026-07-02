import { useEffect, useState } from 'react';
import { apiErrorMessage } from '../../lib/api-error';
import type { ActualizarSolicitudPayload, Solicitud, TurnoInteres } from '../../lib/api';
import { TURNOS } from '../../constants/solicitudes';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type Props = {
  open: boolean;
  solicitud?: Solicitud | null;
  onClose: () => void;
  onSubmit: (payload: ActualizarSolicitudPayload) => Promise<void>;
};

type FormState = {
  nombreContacto: string;
  celular: string;
  correo: string;
  fechaTentativa: string;
  turnoInteres: '' | TurnoInteres;
  cantidadNinosEstimada: string;
  notas: string;
  proximoSeguimiento: string;
};

const EMPTY: FormState = {
  nombreContacto: '',
  celular: '',
  correo: '',
  fechaTentativa: '',
  turnoInteres: '',
  cantidadNinosEstimada: '',
  notas: '',
  proximoSeguimiento: '',
};

function toDateInput(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromSolicitud(s: Solicitud): FormState {
  return {
    nombreContacto: s.nombreContacto,
    celular: s.celular,
    correo: s.correo ?? '',
    fechaTentativa: toDateInput(s.fechaTentativa),
    turnoInteres: s.turnoInteres ?? '',
    cantidadNinosEstimada:
      s.cantidadNinosEstimada != null ? String(s.cantidadNinosEstimada) : '',
    notas: s.notas ?? '',
    proximoSeguimiento: toDatetimeLocal(s.proximoSeguimientoEn),
  };
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function SolicitudFormModal({ open, solicitud, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !solicitud) return;
    setForm(fromSolicitud(solicitud));
    setPending(false);
    setError('');
  }, [open, solicitud]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitud) return;
    if (!form.nombreContacto.trim() || !form.celular.trim()) {
      setError('Nombre y celular son obligatorios.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit({
        nombreContacto: form.nombreContacto.trim(),
        celular: form.celular.trim(),
        correo: optionalText(form.correo),
        fechaTentativa: form.fechaTentativa.trim(),
        turnoInteres: form.turnoInteres ? form.turnoInteres : null,
        cantidadNinosEstimada: form.cantidadNinosEstimada
          ? Number(form.cantidadNinosEstimada)
          : undefined,
        notas: form.notas,
        proximoSeguimientoEn: form.proximoSeguimiento
          ? new Date(form.proximoSeguimiento).toISOString()
          : undefined,
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo guardar la solicitud'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar solicitud" size="lg">
      {!solicitud ? (
        <p className="text-on-surface-variant">Cargando solicitud…</p>
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block sm:col-span-2">
            <span className={LABEL_CLASS}>Nombre contacto *</span>
            <input
              className={INPUT_CLASS}
              value={form.nombreContacto}
              onChange={(e) => setForm((p) => ({ ...p, nombreContacto: e.target.value }))}
              placeholder="Ej. Carlos Ruiz"
            />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Celular *</span>
            <input
              className={INPUT_CLASS}
              value={form.celular}
              onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value }))}
              placeholder="988 777 666"
            />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Correo</span>
            <input
              type="email"
              className={INPUT_CLASS}
              value={form.correo}
              onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))}
              placeholder="contacto@correo.com"
            />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Fecha tentativa</span>
            <input
              type="date"
              className={INPUT_CLASS}
              value={form.fechaTentativa}
              onChange={(e) => setForm((p) => ({ ...p, fechaTentativa: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Turno de interés</span>
            <select
              className={INPUT_CLASS}
              value={form.turnoInteres}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  turnoInteres: e.target.value as FormState['turnoInteres'],
                }))
              }
            >
              <option value="">Sin turno</option>
              {TURNOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Niños estimados</span>
            <input
              type="number"
              min={1}
              max={50}
              className={INPUT_CLASS}
              value={form.cantidadNinosEstimada}
              onChange={(e) =>
                setForm((p) => ({ ...p, cantidadNinosEstimada: e.target.value }))
              }
              placeholder="25"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={LABEL_CLASS}>Próximo seguimiento</span>
            <input
              type="datetime-local"
              className={INPUT_CLASS}
              value={form.proximoSeguimiento}
              onChange={(e) =>
                setForm((p) => ({ ...p, proximoSeguimiento: e.target.value }))
              }
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={LABEL_CLASS}>Notas</span>
            <textarea
              rows={3}
              className={INPUT_CLASS}
              value={form.notas}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              placeholder="Detalle del evento o pedido del cliente"
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
