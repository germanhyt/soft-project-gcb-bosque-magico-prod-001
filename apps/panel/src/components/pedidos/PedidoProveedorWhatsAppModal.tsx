import { useEffect, useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import type { Pedido } from '../../lib/pedidos';
import { linkWaMe } from '../../lib/contacto-links';
import {
  buildPedidoProveedorEventoResumen,
  type PedidoProveedorEventoResumen,
} from '../../lib/pedido-proveedor-evento';
import { mensajePedidoProveedor } from '../../lib/whatsapp-pedido-proveedor';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

type Props = {
  open: boolean;
  onClose: () => void;
  pedido: Pedido;
  evento: PedidoProveedorEventoResumen;
};

export function PedidoProveedorWhatsAppModal({ open, onClose, pedido, evento }: Props) {
  const [mensaje, setMensaje] = useState('');
  const celular = pedido.proveedor?.celular?.trim() ?? '';

  useEffect(() => {
    if (open) {
      setMensaje(
        mensajePedidoProveedor(pedido, {
          clienteNombre: evento.clienteNombre,
          fechaEvento: evento.fechaEvento,
          turnoLabel: evento.turnoLabel,
        }),
      );
    }
  }, [open, pedido, evento.clienteNombre, evento.fechaEvento, evento.turnoLabel]);

  const abrirWhatsApp = () => {
    if (!celular) return;
    window.open(linkWaMe(celular, mensaje), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="WhatsApp al proveedor"
      description="Revisa el mensaje antes de abrir WhatsApp."
      size="lg"
    >
      <div className="space-y-4">
        {!celular ? (
          <p className="text-body-sm text-error">El proveedor no tiene celular registrado.</p>
        ) : (
          <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 px-3 py-2 text-body-sm">
            <span className="text-outline">Para: </span>
            <span className="font-medium text-on-surface">{celular}</span>
            {pedido.proveedor?.nombre ? (
              <span className="block text-xs text-outline">{pedido.proveedor.nombre}</span>
            ) : null}
          </div>
        )}
        <label className="block">
          <span className={LABEL_CLASS}>Mensaje</span>
          <textarea
            className={`${INPUT_CLASS} min-h-[180px] resize-y`}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={10}
            disabled={!celular}
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          className="inline-flex gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a]"
          onClick={abrirWhatsApp}
          disabled={!celular || !mensaje.trim()}
        >
          <WhatsAppIcon size={20} className="text-white" />
          Abrir WhatsApp
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}

export { buildPedidoProveedorEventoResumen };
