import { useEffect, useState } from 'react';
import { apiErrorMessage } from '../../lib/api-error';
import type { Producto } from '../../lib/cotizaciones';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProductImageDropzone } from './ProductImageDropzone';

export type ProductoFormPayload = {
  codigo: string;
  nombre: string;
  categoria: string;
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima: number;
  descripcion?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductoFormPayload) => Promise<void>;
  producto?: Producto | null;
  puedeGestionarImagen?: boolean;
  onUploadImagen?: (file: File) => Promise<void>;
  onQuitarImagen?: () => Promise<void>;
};

const EMPTY = {
  codigo: '',
  nombre: '',
  categoria: 'show',
  precioLunesViernes: '',
  precioFinSemana: '',
  cantidadMinima: '1',
  descripcion: '',
};

function formFromProducto(p: Producto) {
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria,
    precioLunesViernes: String(p.precioLunesViernes),
    precioFinSemana: String(p.precioFinSemana),
    cantidadMinima: String(p.cantidadMinima ?? 1),
    descripcion: p.descripcion ?? '',
  };
}

export function ProductoFormModal({
  open,
  onClose,
  onSubmit,
  producto,
  puedeGestionarImagen = true,
  onUploadImagen,
  onQuitarImagen,
}: Props) {
  const esEdicion = Boolean(producto);
  const [form, setForm] = useState(EMPTY);
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(producto ? formFromProducto(producto) : EMPTY);
    setImagenUrl(producto?.imagenUrl ?? null);
    setError('');
    setPending(false);
  }, [open, producto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError('Código y nombre son obligatorios');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit({
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precioLunesViernes: Number(form.precioLunesViernes),
        precioFinSemana: Number(form.precioFinSemana),
        cantidadMinima: Number(form.cantidadMinima) || 1,
        descripcion: form.descripcion.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        apiErrorMessage(err, esEdicion ? 'No se pudo guardar el producto' : 'No se pudo crear el producto'),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar producto' : 'Nuevo producto'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-1">
          <span className={LABEL_CLASS}>Código *</span>
          <input
            className={INPUT_CLASS}
            value={form.codigo}
            readOnly={esEdicion}
            disabled={esEdicion}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-1">
          <span className={LABEL_CLASS}>Nombre *</span>
          <input
            className={INPUT_CLASS}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Categoría</span>
          <select
            className={INPUT_CLASS}
            value={form.categoria}
            onChange={(e) => {
              const categoria = e.target.value;
              setForm({
                ...form,
                categoria,
                cantidadMinima: categoria === 'catering' ? '18' : form.cantidadMinima,
              });
            }}
          >
            <option value="show">Show</option>
            <option value="catering">Catering</option>
            <option value="extra">Extra</option>
            <option value="paquete">Paquete</option>
            <option value="espacio">Espacio</option>
          </select>
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Mínimo unidades</span>
          <input
            type="number"
            min={1}
            className={INPUT_CLASS}
            value={form.cantidadMinima}
            onChange={(e) => setForm({ ...form, cantidadMinima: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Precio L-V (S/)</span>
          <input
            type="number"
            step="0.01"
            className={INPUT_CLASS}
            value={form.precioLunesViernes}
            onChange={(e) => setForm({ ...form, precioLunesViernes: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Precio fin de semana (S/)</span>
          <input
            type="number"
            step="0.01"
            className={INPUT_CLASS}
            value={form.precioFinSemana}
            onChange={(e) => setForm({ ...form, precioFinSemana: e.target.value })}
          />
        </label>
        {esEdicion && producto && onUploadImagen && (
          <div className="sm:col-span-2">
            <span className={LABEL_CLASS}>Imagen del producto</span>
            <p className="mb-2 text-body-sm text-outline">
              Se muestra en la landing. Puedes reemplazarla o quitarla.
            </p>
            <ProductImageDropzone
              imagenUrl={imagenUrl}
              disabled={!puedeGestionarImagen}
              onUpload={onUploadImagen}
              onRemove={imagenUrl && onQuitarImagen ? onQuitarImagen : undefined}
            />
          </div>
        )}
        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Descripción (opcional)</span>
          <textarea
            rows={3}
            className={INPUT_CLASS}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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
            {pending ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
