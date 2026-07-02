import { useState } from 'react';
import Swal from 'sweetalert2';
import { RowActionDivider, RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import type { Pedido } from '../../lib/pedidos';
import { buildPedidoProveedorEventoResumen } from '../../lib/pedido-proveedor-evento';
import { linkPedidoProveedorCompleto } from '../../lib/pedidos-links';
import { EnviarPedidoProveedorCorreoModal } from './EnviarPedidoProveedorCorreoModal';
import { PedidoProveedorWhatsAppModal } from './PedidoProveedorWhatsAppModal';

export type PedidoOperaciones = Pedido & {
  evento: {
    id: string;
    fechaEvento: string;
    turno: string;
    etapa: string;
    cliente: { nombreCompleto: string };
  };
};

export function puedeOperarPedidosEvento(etapaEvento: string) {
  return (
    etapaEvento === 'por_confirmar' ||
    etapaEvento === 'confirmado' ||
    etapaEvento === 'realizado'
  );
}

type Props = {
  pedido: PedidoOperaciones;
  onVerEvento: (eventoId: string) => void;
};

export function PedidoOperacionesRowActions({ pedido, onVerEvento }: Props) {
  const [waOpen, setWaOpen] = useState(false);
  const [correoOpen, setCorreoOpen] = useState(false);
  const puedeOperar = puedeOperarPedidosEvento(pedido.evento.etapa);
  const esProveedor = pedido.tipo === 'proveedor';
  const tieneEnlace = !!(pedido.linkPublico || pedido.tokenPublico);
  const celular = pedido.proveedor?.celular;
  const correo = pedido.proveedor?.correo;

  const eventoResumen = buildPedidoProveedorEventoResumen(pedido);

  const mostrarProveedor =
    puedeOperar && esProveedor && (tieneEnlace || celular || correo);

  return (
    <>
      <RowActionsToolbar>
        <RowIconButton
          icon="calendar_month"
          title="Ver evento en agenda"
          aria-label="Ver evento en agenda"
          onClick={() => onVerEvento(pedido.evento.id)}
        />

        {mostrarProveedor && (
          <>
            <RowActionDivider />
            {tieneEnlace && (
              <RowIconButton
                icon="link"
                title="Copiar enlace proveedor"
                aria-label="Copiar enlace proveedor"
                onClick={async () => {
                  const url = linkPedidoProveedorCompleto(
                    pedido.linkPublico || pedido.tokenPublico!,
                  );
                  await navigator.clipboard.writeText(url);
                  await Swal.fire({
                    icon: 'success',
                    title: 'Enlace copiado',
                    text: 'Compártelo con el proveedor para confirmar o rechazar.',
                    timer: 1600,
                    showConfirmButton: false,
                  });
                }}
              />
            )}
            {celular && (
              <RowIconButton
                whatsapp
                title="WhatsApp al proveedor"
                aria-label="WhatsApp al proveedor"
                onClick={() => setWaOpen(true)}
              />
            )}
            {correo && (
              <RowIconButton
                icon="mail"
                title="Correo al proveedor"
                aria-label="Correo al proveedor"
                onClick={() => setCorreoOpen(true)}
              />
            )}
          </>
        )}
      </RowActionsToolbar>

      {celular && (
        <PedidoProveedorWhatsAppModal
          open={waOpen}
          onClose={() => setWaOpen(false)}
          pedido={pedido}
          evento={eventoResumen}
        />
      )}
      {correo && (
        <EnviarPedidoProveedorCorreoModal
          open={correoOpen}
          onClose={() => setCorreoOpen(false)}
          pedido={pedido}
          evento={eventoResumen}
        />
      )}
    </>
  );
}
