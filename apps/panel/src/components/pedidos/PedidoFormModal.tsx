import { useEffect, useState } from 'react';
import { AREAS_PEDIDO_OPCIONES } from '../../constants/pedidos';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { apiErrorMessage } from '../../lib/api-error';
import { claveFechaCalendario } from '../../lib/fecha-calendario';
import type { AreaPedido, TipoPedido } from '../../lib/pedidos';
import type { Producto } from '../../lib/cotizaciones';
import type { Proveedor } from '../../lib/proveedores';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

function fechaParaInputCalendario(value: string): string {
  return claveFechaCalendario(value) ?? '';
}

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
  const [costoManual, setCostoManual] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, fechaRequerida: fechaParaInputCalendario(fechaEvento) });
    setError('');
    setPending(false);
    setCostoManual(false);
  }, [open, fechaEvento]);

  const onProductoChange = (productoId: string) => {
    const p = productos.find((x) => x.id === productoId);
    const cantidad = Number(form.cantidad);
    const cantidadValida = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
    const costoSugerido =
      p?.costoInterno != null
        ? String(Number((p.costoInterno * cantidadValida).toFixed(2)))
        : form.costo;
    setForm((f) => ({
      ...f,
      productoId,
      nombre: p?.nombre ?? f.nombre,
      tipo: p?.origen === 'proveedor' ? 'proveedor' : f.tipo,
      proveedorId: p?.proveedorId ?? f.proveedorId,
      costo: costoSugerido,
    }));
    setCostoManual(false);
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
        fechaRequerida: form.fechaRequerida
          ? (claveFechaCalendario(form.fechaRequerida) ?? undefined)
          : undefined,
        notas: form.notas.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'No se pudo guardar'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo pedido" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Tipo</span>
            <select
              className={INPUT_CLASS}
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoPedido }))}
            >
              <option value="interno">Interno</option>
              <option value="proveedor">Proveedor</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Área</span>
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
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Producto (opcional)</span>
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

        <label className="block space-y-2">
          <span className={LABEL_CLASS}>Descripción *</span>
          <input
            className={INPUT_CLASS}
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Cantidad</span>
            <input
              type="number"
              min={1}
              className={INPUT_CLASS}
              value={form.cantidad}
              onChange={(e) => {
                const cantidad = e.target.value;
                setForm((f) => {
                  if (!f.productoId || costoManual) return { ...f, cantidad };
                  const producto = productos.find((x) => x.id === f.productoId);
                  if (producto?.costoInterno == null) return { ...f, cantidad };
                  const qty = Number(cantidad);
                  const qtyValida = Number.isFinite(qty) && qty > 0 ? qty : 1;
                  return {
                    ...f,
                    cantidad,
                    costo: String(Number((producto.costoInterno * qtyValida).toFixed(2))),
                  };
                });
              }}
            />
          </label>
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Costo total (S/)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className={INPUT_CLASS}
              value={form.costo}
              onChange={(e) => {
                setCostoManual(true);
                setForm((f) => ({ ...f, costo: e.target.value }));
              }}
            />
            {form.productoId && !costoManual && (
              <p className="text-xs text-outline">
                Se calcula automáticamente por producto x cantidad.
              </p>
            )}
          </label>
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Fecha requerida</span>
            <input
              type="date"
              className={INPUT_CLASS}
              value={form.fechaRequerida}
              onChange={(e) => setForm((f) => ({ ...f, fechaRequerida: e.target.value }))}
            />
          </label>
        </div>

        {form.tipo === 'proveedor' && proveedores.length > 0 && (
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Proveedor</span>
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

        <label className="block space-y-2">
          <span className={LABEL_CLASS}>Notas</span>
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
