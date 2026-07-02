import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import {
  asuntoCorreoPedidoProveedor,
  mensajePedidoProveedor,
} from '../../lib/whatsapp-pedido-proveedor';
import { enviarCorreoPedidoProveedor } from '../../lib/enviar-pedido-proveedor-correo';
import { parseSmtpEstado } from '../../lib/smtp-config';
import type { Pedido } from '../../lib/pedidos';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

import type { PedidoProveedorEventoResumen } from '../../lib/pedido-proveedor-evento';

type Props = {
  open: boolean;
  onClose: () => void;
  pedido: Pedido;
  evento: PedidoProveedorEventoResumen;
};

export function EnviarPedidoProveedorCorreoModal({
  open,
  onClose,
  pedido,
  evento,
}: Props) {
  const qc = useQueryClient();
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const correo = pedido.proveedor?.correo?.trim() ?? '';

  const { data: smtpActivo = false } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    select: (data) => (data.meta?.smtp ?? parseSmtpEstado(data.smtp)).activo,
    staleTime: 60_000,
    enabled: open,
  });

  const eventoResumen = {
    clienteNombre: evento.clienteNombre,
    fechaEvento: evento.fechaEvento,
    turnoLabel: evento.turnoLabel,
  };

  useEffect(() => {
    if (open) {
      setAsunto(asuntoCorreoPedidoProveedor(pedido, eventoResumen));
      setMensaje(mensajePedidoProveedor(pedido, eventoResumen));
    }
  }, [open, pedido, evento.clienteNombre, evento.fechaEvento, evento.turnoLabel]);

  const enviarMut = useMutation({
    mutationFn: () =>
      enviarCorreoPedidoProveedor(
        pedido.id,
        qc,
        { asunto: asunto.trim(), cuerpo: mensaje.trim() },
        evento.id,
      ),
    onSuccess: () => onClose(),
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : err instanceof Error
            ? err.message
            : 'No se pudo enviar';
      await Swal.fire({ icon: 'error', title: 'Error', text: msg || undefined });
    },
  });

  const listo = !!correo;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enviar pedido por correo"
      description={
        smtpActivo
          ? 'Revisa el asunto y el mensaje. Se enviará automáticamente vía SMTP.'
          : 'Revisa el asunto y el mensaje. Luego se abrirá tu cliente de correo para enviar manualmente.'
      }
      size="lg"
    >
      <div className="space-y-4">
        {!correo ? (
          <p className="text-body-sm text-error">El proveedor no tiene correo registrado.</p>
        ) : (
          <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 px-3 py-2 text-body-sm">
            <span className="text-outline">Para: </span>
            <span className="font-medium text-on-surface">{correo}</span>
            {pedido.proveedor?.nombre ? (
              <span className="block text-xs text-outline">{pedido.proveedor.nombre}</span>
            ) : null}
          </div>
        )}
        <label className="block">
          <span className={LABEL_CLASS}>Asunto</span>
          <input
            className={INPUT_CLASS}
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            disabled={!listo}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Mensaje</span>
          <textarea
            className={`${INPUT_CLASS} min-h-[180px] resize-y`}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={10}
            disabled={!listo}
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={enviarMut.isPending}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="inline-flex gap-2"
          disabled={!listo || !asunto.trim() || !mensaje.trim() || enviarMut.isPending}
          onClick={() => enviarMut.mutate()}
        >
          <Icon name="mail" size={20} />
          {enviarMut.isPending
            ? 'Enviando…'
            : smtpActivo
              ? 'Enviar por SMTP'
              : 'Abrir correo y enviar'}
        </Button>
      </div>
    </Modal>
  );
}
