import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '../../lib/api-error';
import type { Producto } from '../../lib/cotizaciones';
import { fetchProveedores } from '../../lib/proveedores-api';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ProductoMediaSection } from './ProductoMediaSection';

export type ProductoFormPayload = {
  codigo: string;
  nombre: string;
  categoria: string;
  precioLunesViernes: number;
  precioFinSemana: number;
  cantidadMinima: number;
  subtipo?: 'general' | 'cajita' | 'piqueo' | 'snack';
  unidadesPack?: number;
  descripcion?: string;
  origen?: 'propio' | 'proveedor';
  costoInterno?: number;
  proveedorId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductoFormPayload) => Promise<void>;
  producto?: Producto | null;
  puedeGestionarImagen?: boolean;
  onUploadImagen?: (file: File) => Promise<void>;
  onEliminarMedia?: (mediaId: string) => Promise<void>;
  onGuardarVideoUrl?: (url: string) => Promise<void>;
  onSubirVideo?: (file: File) => Promise<void>;
  onEliminarVideo?: () => Promise<void>;
};

const EMPTY = {
  codigo: '',
  nombre: '',
  categoria: 'show',
  subtipo: 'general',
  unidadesPack: '',
  precioLunesViernes: '',
  precioFinSemana: '',
  cantidadMinima: '1',
  descripcion: '',
  origen: 'propio',
  costoInterno: '',
  proveedorId: '',
};

function formFromProducto(p: Producto) {
  return {
    codigo: p.codigo,
    nombre: p.nombre,
    categoria: p.categoria,
    subtipo: p.subtipo ?? 'general',
    unidadesPack: p.unidadesPack != null ? String(p.unidadesPack) : '',
    precioLunesViernes: String(p.precioLunesViernes),
    precioFinSemana: String(p.precioFinSemana),
    cantidadMinima: String(p.cantidadMinima ?? 1),
    descripcion: p.descripcion ?? '',
    origen: p.origen ?? 'propio',
    costoInterno: p.costoInterno != null ? String(p.costoInterno) : '',
    proveedorId: p.proveedorId ?? '',
  };
}

export function ProductoFormModal({
  open,
  onClose,
  onSubmit,
  producto,
  puedeGestionarImagen = true,
  onUploadImagen,
  onEliminarMedia,
  onGuardarVideoUrl,
  onSubirVideo,
  onEliminarVideo,
}: Props) {
  const esEdicion = Boolean(producto);
  const [form, setForm] = useState(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores', 'activos'],
    queryFn: () => fetchProveedores(true),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setForm(producto ? formFromProducto(producto) : EMPTY);
    setError('');
    setPending(false);
  }, [open, producto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError('Código y nombre son obligatorios');
      return;
    }
    const precioLunesViernes = Number(form.precioLunesViernes);
    const precioFinSemana = Number(form.precioFinSemana);
    const cantidadMinima = Number(form.cantidadMinima) || 1;
    const costoInterno = form.costoInterno ? Number(form.costoInterno) : undefined;
    const unidadesPack =
      form.categoria === 'catering' && form.subtipo === 'piqueo' && form.unidadesPack
        ? Number(form.unidadesPack)
        : undefined;
    if (!Number.isFinite(precioLunesViernes) || !Number.isFinite(precioFinSemana)) {
      setError('Los precios deben ser números válidos');
      return;
    }
    if (precioLunesViernes < 0 || precioFinSemana < 0) {
      setError('Los precios no pueden ser negativos');
      return;
    }
    if (!Number.isInteger(cantidadMinima) || cantidadMinima < 1) {
      setError('El mínimo de unidades debe ser un entero mayor o igual a 1');
      return;
    }
    if (
      form.categoria === 'catering' &&
      form.subtipo === 'piqueo' &&
      form.unidadesPack &&
      (!Number.isInteger(unidadesPack) || (unidadesPack ?? 0) < 1)
    ) {
      setError('Unidades por pack debe ser un entero mayor o igual a 1');
      return;
    }
    if (costoInterno != null && (!Number.isFinite(costoInterno) || costoInterno < 0)) {
      setError('El costo interno debe ser un número válido mayor o igual a 0');
      return;
    }
    if (form.origen === 'proveedor' && !form.proveedorId) {
      setError('Selecciona un proveedor cuando el origen es externo');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit({
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precioLunesViernes,
        precioFinSemana,
        cantidadMinima,
        subtipo:
          form.categoria === 'catering'
            ? (form.subtipo as ProductoFormPayload['subtipo'])
            : undefined,
        unidadesPack,
        descripcion: form.descripcion.trim() || undefined,
        origen: form.origen as 'propio' | 'proveedor',
        costoInterno,
        proveedorId: form.proveedorId || undefined,
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
                subtipo: categoria === 'catering' ? form.subtipo : 'general',
                unidadesPack: categoria === 'catering' && form.subtipo === 'piqueo' ? form.unidadesPack : '',
                cantidadMinima:
                  categoria === 'catering' && form.subtipo === 'piqueo'
                    ? '1'
                    : categoria === 'catering'
                      ? '18'
                      : form.cantidadMinima,
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
        {form.categoria === 'catering' && (
          <label className="block">
            <span className={LABEL_CLASS}>Subtipo catering</span>
            <select
              className={INPUT_CLASS}
              value={form.subtipo}
              onChange={(e) => {
                const subtipo = e.target.value;
                setForm({
                  ...form,
                  subtipo,
                  cantidadMinima: subtipo === 'piqueo' ? '1' : form.cantidadMinima,
                  unidadesPack: subtipo === 'piqueo' ? form.unidadesPack || '25' : '',
                });
              }}
            >
              <option value="general">General (catering adicional)</option>
              <option value="piqueo">Piqueo Premium (precio por pack)</option>
              <option value="cajita">Cajita Bosque</option>
              <option value="snack">Snack incluido Premium</option>
            </select>
          </label>
        )}
        {form.categoria === 'catering' && form.subtipo === 'piqueo' && (
          <label className="block">
            <span className={LABEL_CLASS}>Unidades por pack</span>
            <input
              type="number"
              min={1}
              className={INPUT_CLASS}
              value={form.unidadesPack}
              onChange={(e) => setForm({ ...form, unidadesPack: e.target.value })}
              placeholder="Ej. 25 porciones por pack"
            />
          </label>
        )}
        <label className="block">
          <span className={LABEL_CLASS}>
            {form.categoria === 'catering' && form.subtipo === 'piqueo'
              ? 'Mínimo packs'
              : 'Mínimo unidades'}
          </span>
          <input
            type="number"
            min={1}
            className={INPUT_CLASS}
            value={form.cantidadMinima}
            onChange={(e) => setForm({ ...form, cantidadMinima: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>
            {form.categoria === 'catering' && form.subtipo === 'piqueo'
              ? 'Precio por pack L-V (S/)'
              : 'Precio L-V (S/)'}
          </span>
          <input
            type="number"
            step="0.01"
            className={INPUT_CLASS}
            value={form.precioLunesViernes}
            onChange={(e) => setForm({ ...form, precioLunesViernes: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>
            {form.categoria === 'catering' && form.subtipo === 'piqueo'
              ? 'Precio por pack fin de semana (S/)'
              : 'Precio fin de semana (S/)'}
          </span>
          <input
            type="number"
            step="0.01"
            className={INPUT_CLASS}
            value={form.precioFinSemana}
            onChange={(e) => setForm({ ...form, precioFinSemana: e.target.value })}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Origen</span>
          <select
            className={INPUT_CLASS}
            value={form.origen}
            onChange={(e) => {
              const origen = e.target.value as 'propio' | 'proveedor';
              setForm({
                ...form,
                origen,
                proveedorId: origen === 'proveedor' ? form.proveedorId : '',
              });
            }}
          >
            <option value="propio">Propio (Bosque)</option>
            <option value="proveedor">Proveedor externo</option>
          </select>
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Costo interno (S/)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            className={INPUT_CLASS}
            value={form.costoInterno}
            onChange={(e) => setForm({ ...form, costoInterno: e.target.value })}
            placeholder="Costo a proveedor"
          />
        </label>
        {form.origen === 'proveedor' && (
          <label className="block sm:col-span-2">
            <span className={LABEL_CLASS}>Proveedor</span>
            <select
              className={INPUT_CLASS}
              value={form.proveedorId}
              onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}
            >
              <option value="">— Seleccionar —</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        {esEdicion && producto && onUploadImagen && onEliminarMedia && onGuardarVideoUrl && onSubirVideo && onEliminarVideo && (
          <ProductoMediaSection
            producto={producto}
            disabled={!puedeGestionarImagen}
            onUploadImagen={onUploadImagen}
            onEliminarMedia={onEliminarMedia}
            onGuardarVideoUrl={onGuardarVideoUrl}
            onSubirVideo={onSubirVideo}
            onEliminarVideo={onEliminarVideo}
          />
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
