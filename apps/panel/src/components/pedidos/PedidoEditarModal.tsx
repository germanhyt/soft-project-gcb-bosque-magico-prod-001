import { useEffect, useState } from 'react';
import { AREAS_PEDIDO_OPCIONES } from '../../constants/pedidos';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { apiErrorMessage } from '../../lib/api-error';
import { claveFechaCalendario } from '../../lib/fecha-calendario';
import type { AreaPedido, Pedido } from '../../lib/pedidos';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export type PedidoEditarPayload = {
  cantidad: number;
  area: AreaPedido;
  costo: number;
  fechaRequerida?: string;
  notas?: string;
};

type Props = {
  open: boolean;
  pedido: Pedido | null;
  onClose: () => void;
  onSubmit: (id: string, payload: PedidoEditarPayload) => Promise<void>;
  nested?: boolean;
};

export function PedidoEditarModal({
  open,
  pedido,
  onClose,
  onSubmit,
  nested = true,
}: Props) {
  const [cantidad, setCantidad] = useState('1');
  const [area, setArea] = useState<AreaPedido>('operaciones');
  const [costo, setCosto] = useState('');
  const [fechaRequerida, setFechaRequerida] = useState('');
  const [notas, setNotas] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !pedido) return;
    setCantidad(String(pedido.cantidad));
    setArea(pedido.area);
    setCosto(String(pedido.costo));
    setFechaRequerida(claveFechaCalendario(pedido.fechaRequerida ?? '') ?? '');
    setNotas(pedido.notas ?? '');
    setError('');
    setPending(false);
  }, [open, pedido]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pedido) return;
    const costoNum = Number(costo);
    const cantidadNum = Number(cantidad);
    if (!Number.isFinite(costoNum) || costoNum < 0) {
      setError('Costo inválido');
      return;
    }
    if (!Number.isFinite(cantidadNum) || cantidadNum < 1) {
      setError('Cantidad inválida');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit(pedido.id, {
        cantidad: cantidadNum,
        area,
        costo: costoNum,
        fechaRequerida: fechaRequerida || undefined,
        notas: notas.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'No se pudo guardar'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar pedido" size="lg" nested={nested}>
      {pedido && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-body-sm text-on-surface">
            <span className="font-medium">{pedido.nombre}</span>
            {pedido.proveedor?.nombre ? (
              <span className="block text-xs text-outline">{pedido.proveedor.nombre}</span>
            ) : null}
          </p>
          {pedido.costoEstimadoProveedor != null && (
            <p className="rounded-lg bg-tertiary-fixed/40 px-3 py-2 text-body-sm text-tertiary">
              Costo estimado del proveedor: S/ {pedido.costoEstimadoProveedor.toFixed(2)}
              {pedido.comentarioProveedor ? ` — ${pedido.comentarioProveedor}` : ''}
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className={LABEL_CLASS}>Área</span>
              <select
                className={INPUT_CLASS}
                value={area}
                onChange={(e) => setArea(e.target.value as AreaPedido)}
              >
                {AREAS_PEDIDO_OPCIONES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className={LABEL_CLASS}>Cantidad</span>
              <input
                type="number"
                min={1}
                className={INPUT_CLASS}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className={LABEL_CLASS}>Costo acordado (S/)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                className={INPUT_CLASS}
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className={LABEL_CLASS}>Fecha requerida</span>
              <input
                type="date"
                className={INPUT_CLASS}
                value={fechaRequerida}
                onChange={(e) => setFechaRequerida(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className={LABEL_CLASS}>Notas</span>
            <textarea
              className={`${INPUT_CLASS} min-h-[72px]`}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
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
      )}
    </Modal>
  );
}
