import { useEffect, useMemo, useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import type { Pedido } from '../../lib/pedidos';
import { linkWaMe } from '../../lib/contacto-links';
import type { PedidoProveedorEventoResumen } from '../../lib/pedido-proveedor-evento';
import { mensajePedidosProveedorGrupo } from '../../lib/whatsapp-pedido-proveedor';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

type Props = {
  open: boolean;
  onClose: () => void;
  /** Uno o varios pedidos del mismo proveedor / evento. */
  pedidos: Pedido[];
  evento: PedidoProveedorEventoResumen;
};

export function PedidoProveedorWhatsAppModal({
  open,
  onClose,
  pedidos,
  evento,
}: Props) {
  const [mensaje, setMensaje] = useState('');
  const principal = pedidos[0];
  const celular = principal?.proveedor?.celular?.trim() ?? '';
  const nombre = principal?.proveedor?.nombre;
  const titulo =
    pedidos.length > 1
      ? `WhatsApp al proveedor (${pedidos.length} servicios)`
      : 'WhatsApp al proveedor';

  const eventoResumen = useMemo(
    () => ({
      clienteNombre: evento.clienteNombre,
      fechaEvento: evento.fechaEvento,
      turnoLabel: evento.turnoLabel,
      cumpleaneroEdad: evento.cumpleaneroEdad,
      cantidadNinos: evento.cantidadNinos,
      tematica: evento.tematica,
    }),
    [
      evento.clienteNombre,
      evento.fechaEvento,
      evento.turnoLabel,
      evento.cumpleaneroEdad,
      evento.cantidadNinos,
      evento.tematica,
    ],
  );

  useEffect(() => {
    if (open && pedidos.length) {
      setMensaje(mensajePedidosProveedorGrupo(pedidos, eventoResumen));
    }
  }, [open, pedidos, eventoResumen]);

  const abrirWhatsApp = () => {
    if (!celular) return;
    window.open(linkWaMe(celular, mensaje), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={titulo} description="Revisa el mensaje antes de abrir WhatsApp." size="lg">
      <div className="space-y-4">
        {!celular ? (
          <p className="text-body-sm text-error">El proveedor no tiene celular registrado.</p>
        ) : (
          <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 px-3 py-2 text-body-sm">
            <span className="text-outline">Para: </span>
            <span className="font-medium text-on-surface">{celular}</span>
            {nombre ? <span className="block text-xs text-outline">{nombre}</span> : null}
          </div>
        )}
        <label className="block">
          <span className={LABEL_CLASS}>Mensaje</span>
          <textarea
            className={`${INPUT_CLASS} min-h-[180px] resize-y`}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={12}
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
