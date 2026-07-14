import { useMemo, useState } from 'react';
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
    cantidadNinos: number;
    tematica: string | null;
    cumpleanero: { edad: number | null };
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
  /** Otros pedidos del mismo evento+proveedor (incluye el actual). */
  pedidosMismoProveedor?: PedidoOperaciones[];
  onVerEvento: (eventoId: string) => void;
};

export function PedidoOperacionesRowActions({
  pedido,
  pedidosMismoProveedor,
  onVerEvento,
}: Props) {
  const [waOpen, setWaOpen] = useState(false);
  const [correoOpen, setCorreoOpen] = useState(false);
  const puedeOperar = puedeOperarPedidosEvento(pedido.evento.etapa);
  const esProveedor = pedido.tipo === 'proveedor';
  const tieneEnlace = !!(pedido.linkPublico || pedido.tokenPublico);
  const celular = pedido.proveedor?.celular;
  const correo = pedido.proveedor?.correo;

  const grupo = useMemo(() => {
    const list = pedidosMismoProveedor?.length
      ? pedidosMismoProveedor
      : [pedido];
    return list.filter((p) => p.tipo === 'proveedor');
  }, [pedido, pedidosMismoProveedor]);

  const eventoResumen = buildPedidoProveedorEventoResumen(pedido);
  const n = grupo.length;

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
                title="Copiar enlace de este ítem"
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
                title={
                  n > 1
                    ? `WhatsApp proveedor (${n} servicios del evento)`
                    : 'WhatsApp al proveedor'
                }
                aria-label="WhatsApp al proveedor"
                onClick={() => setWaOpen(true)}
              />
            )}
            {correo && (
              <RowIconButton
                icon="mail"
                title={
                  n > 1
                    ? `Correo proveedor (${n} servicios del evento)`
                    : 'Correo al proveedor'
                }
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
          pedidos={grupo}
          evento={eventoResumen}
        />
      )}
      {correo && (
        <EnviarPedidoProveedorCorreoModal
          open={correoOpen}
          onClose={() => setCorreoOpen(false)}
          pedidos={grupo}
          evento={eventoResumen}
        />
      )}
    </>
  );
}
