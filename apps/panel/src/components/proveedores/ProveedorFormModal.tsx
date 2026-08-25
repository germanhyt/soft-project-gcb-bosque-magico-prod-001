import { useEffect, useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import {
  CATEGORIA_PROVEEDOR_OPTIONS,
  type Proveedor,
} from '../../lib/proveedores';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { MultiSelect } from '../ui/MultiSelect';

export type ProveedorFormPayload = {
  nombre: string;
  contacto?: string;
  celular?: string;
  correo?: string;
  categorias: string[];
  notas?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ProveedorFormPayload) => Promise<void>;
  proveedor?: Proveedor | null;
};

const EMPTY = {
  nombre: '',
  contacto: '',
  celular: '',
  correo: '',
  categorias: [] as string[],
  notas: '',
};

const CATEGORIA_OPTIONS = CATEGORIA_PROVEEDOR_OPTIONS.map((categoria) => ({
  value: categoria.value,
  label: categoria.label,
}));

export function ProveedorFormModal({ open, onClose, onSubmit, proveedor }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      proveedor
        ? {
            nombre: proveedor.nombre,
            contacto: proveedor.contacto ?? '',
            celular: proveedor.celular ?? '',
            correo: proveedor.correo ?? '',
            categorias: [...proveedor.categorias],
            notas: proveedor.notas ?? '',
          }
        : EMPTY,
    );
    setError('');
    setPending(false);
  }, [open, proveedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit({
        nombre: form.nombre.trim(),
        contacto: form.contacto.trim() || undefined,
        celular: form.celular.trim() || undefined,
        correo: form.correo.trim() || undefined,
        categorias: Array.from(
          new Set(form.categorias.map((c) => c.trim()).filter(Boolean)),
        ),
        notas: form.notas.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-2">
          <span className={LABEL_CLASS}>Nombre *</span>
          <input
            className={INPUT_CLASS}
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej. Show Magic Pro"
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Contacto</span>
            <input
              className={INPUT_CLASS}
              value={form.contacto}
              onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
              placeholder="Ej. Luis Animador"
            />
          </label>
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Celular / WhatsApp</span>
            <input
              className={INPUT_CLASS}
              value={form.celular}
              onChange={(e) => setForm((f) => ({ ...f, celular: e.target.value }))}
              placeholder="955 444 333"
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className={LABEL_CLASS}>Correo de contacto</span>
          <input
            type="email"
            className={INPUT_CLASS}
            value={form.correo}
            onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
            placeholder="contacto@proveedor.com"
          />
        </label>
        <label className="block space-y-2">
          <span className={LABEL_CLASS}>Categorías</span>
          <MultiSelect
            inputId="proveedor-categorias"
            value={form.categorias}
            options={CATEGORIA_OPTIONS}
            onChange={(categorias) => setForm((f) => ({ ...f, categorias }))}
            placeholder="Selecciona una o más categorías"
          />
        </label>
        <label className="block space-y-2">
          <span className={LABEL_CLASS}>Notas</span>
          <textarea
            className={`${INPUT_CLASS} min-h-[80px]`}
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
            placeholder="Condiciones, horarios o acuerdos"
          />
        </label>
        {error && <p className="text-body-sm text-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
