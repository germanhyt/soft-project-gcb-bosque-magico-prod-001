import type { QueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { linkMailto } from './contacto-links';
import { enviarPedidoProveedorCorreo } from './pedidos-api';

export type CorreoPedidoProveedorPersonalizado = {
  asunto: string;
  cuerpo: string;
};

function abrirClienteCorreo(correo: string, asunto: string, cuerpo?: string) {
  const url = linkMailto(correo, asunto, cuerpo);
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function invalidarTrasPedidoProveedor(
  qc: QueryClient,
  pedidoId: string,
  eventoId?: string,
) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['pedidos-operaciones'] }),
    eventoId
      ? qc.invalidateQueries({ queryKey: ['pedidos-evento', eventoId] })
      : Promise.resolve(),
    qc.invalidateQueries({ queryKey: ['pedidos-evento'] }),
  ]);
  void pedidoId;
}

/**
 * Envía pedido a proveedor por correo: SMTP si está activo; si no, abre mailto con plantilla editada.
 */
export async function enviarCorreoPedidoProveedor(
  pedidoId: string,
  qc: QueryClient,
  personalizado: CorreoPedidoProveedorPersonalizado,
  eventoId?: string,
): Promise<void> {
  const res = await enviarPedidoProveedorCorreo(pedidoId, {
    correoAsunto: personalizado.asunto.trim(),
    correoCuerpo: personalizado.cuerpo.trim(),
  });
  await invalidarTrasPedidoProveedor(qc, pedidoId, eventoId);

  const correo = res.correoDestino?.trim();
  if (!correo) {
    throw new Error('El proveedor no tiene correo registrado');
  }

  const asunto = personalizado.asunto.trim() || res.correoAsunto || '';
  const cuerpo = personalizado.cuerpo.trim() || res.correoCuerpo || '';

  if (res.enviadoPorSmtp) {
    await Swal.fire({
      icon: 'success',
      title: 'Correo enviado',
      text: 'El pedido se envió al proveedor vía SMTP.',
      timer: 2200,
      showConfirmButton: false,
    });
    return;
  }

  if (asunto) {
    abrirClienteCorreo(correo, asunto, cuerpo);
    await Swal.fire({
      icon: 'info',
      title: 'Cliente de correo',
      html: '<p class="text-sm">Se abrió tu aplicación de correo con el mensaje editado. Revisa y envía manualmente.</p>',
      timer: 3200,
      showConfirmButton: false,
    });
  }
}
