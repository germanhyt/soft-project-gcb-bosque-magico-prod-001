import { useEffect, useState } from 'react';
import { AREAS_PEDIDO_OPCIONES } from '../../constants/pedidos';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import type { AreaPedido, TipoPedido } from '../../lib/pedidos';
import type { Producto } from '../../lib/cotizaciones';
import type { Proveedor } from '../../lib/proveedores';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export type PedidoFormPayload = {
  tipo: TipoPedido;
  nombre: string;
  cantidad: number;
  area: AreaPedido;
  costo: number;
  productoId?: string;
  proveedorId?: string;
  fechaRequerida?: string;
  notas?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PedidoFormPayload) => Promise<void>;
  fechaEvento: string;
  productos?: Producto[];
  proveedores?: Proveedor[];
};

const EMPTY = {
  tipo: 'interno' as TipoPedido,
  nombre: '',
  cantidad: '1',
  area: 'operaciones' as AreaPedido,
  costo: '',
  productoId: '',
  proveedorId: '',
  fechaRequerida: '',
  notas: '',
};

export function PedidoFormModal({
  open,
  onClose,
  onSubmit,
  fechaEvento,
  productos = [],
  proveedores = [],
}: Props) {
  const [form, setForm] = useState(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, fechaRequerida: fechaEvento });
    setError('');
    setPending(false);
  }, [open, fechaEvento]);

  const onProductoChange = (productoId: string) => {
    const p = productos.find((x) => x.id === productoId);
    setForm((f) => ({
      ...f,
      productoId,
      nombre: p?.nombre ?? f.nombre,
      tipo: p?.origen === 'proveedor' ? 'proveedor' : f.tipo,
      proveedorId: p?.proveedorId ?? f.proveedorId,
      costo: p?.costoInterno != null ? String(p.costoInterno) : f.costo,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    const costo = Number(form.costo);
    const cantidad = Number(form.cantidad);
    if (!Number.isFinite(costo) || costo < 0) {
      setError('Costo inválido');
      return;
    }
    if (!Number.isFinite(cantidad) || cantidad < 1) {
      setError('Cantidad inválida');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit({
        tipo: form.tipo,
        nombre: form.nombre.trim(),
        cantidad,
        area: form.area,
        costo,
        productoId: form.productoId || undefined,
        proveedorId: form.proveedorId || undefined,
        fechaRequerida: form.fechaRequerida || undefined,
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
    <Modal open={open} onClose={onClose} title="Nuevo pedido" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={LABEL_CLASS}>
            Tipo
            <select
              className={INPUT_CLASS}
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoPedido }))}
            >
              <option value="interno">Interno</option>
              <option value="proveedor">Proveedor</option>
            </select>
          </label>
          <label className={LABEL_CLASS}>
            Área
            <select
              className={INPUT_CLASS}
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value as AreaPedido }))}
            >
              {AREAS_PEDIDO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {productos.length > 0 && (
          <label className={LABEL_CLASS}>
            Producto (opcional)
            <select
              className={INPUT_CLASS}
              value={form.productoId}
              onChange={(e) => onProductoChange(e.target.value)}
            >
              <option value="">— Manual —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className={LABEL_CLASS}>
          Descripción *
          <input
            className={INPUT_CLASS}
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className={LABEL_CLASS}>
            Cantidad
            <input
              type="number"
              min={1}
              className={INPUT_CLASS}
              value={form.cantidad}
              onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
            />
          </label>
          <label className={LABEL_CLASS}>
            Costo total (S/)
            <input
              type="number"
              min={0}
              step="0.01"
              className={INPUT_CLASS}
              value={form.costo}
              onChange={(e) => setForm((f) => ({ ...f, costo: e.target.value }))}
            />
          </label>
          <label className={LABEL_CLASS}>
            Fecha requerida
            <input
              type="date"
              className={INPUT_CLASS}
              value={form.fechaRequerida}
              onChange={(e) => setForm((f) => ({ ...f, fechaRequerida: e.target.value }))}
            />
          </label>
        </div>

        {form.tipo === 'proveedor' && proveedores.length > 0 && (
          <label className={LABEL_CLASS}>
            Proveedor
            <select
              className={INPUT_CLASS}
              value={form.proveedorId}
              onChange={(e) => setForm((f) => ({ ...f, proveedorId: e.target.value }))}
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

        <label className={LABEL_CLASS}>
          Notas
          <textarea
            className={`${INPUT_CLASS} min-h-[72px]`}
            value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
          />
        </label>

        {error && <p className="text-body-sm text-error">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Guardando…' : 'Crear pedido'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
