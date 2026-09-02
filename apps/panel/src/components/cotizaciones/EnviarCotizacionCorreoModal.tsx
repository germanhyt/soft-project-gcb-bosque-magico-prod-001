import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import { fetchCotizacion, linkPdfPublicoCompleto, linkPublicoCompleto } from '../../lib/cotizaciones';
import { enviarCorreoCotizacion } from '../../lib/enviar-cotizacion-correo';
import {
  asuntoCorreoCotizacion,
  mensajeCorreoCotizacion,
} from '../../lib/mensajes-cotizacion-correo';
import { parseSmtpEstado } from '../../lib/smtp-config';
import { mostrarErrorApi } from '../../lib/swal-feedback';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { FormSkeleton } from '../ui/Skeleton';

type ClienteContacto = { celular: string; correo?: string | null; nombreCompleto?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  cotizacionId: string;
  cliente: ClienteContacto;
  /** Datos del listado para prellenar mientras carga el detalle */
  preview?: { codigo?: string; linkPublico?: string; linkPdfPublico?: string; nombreCliente?: string };
  onSuccess?: () => void;
};

export function EnviarCotizacionCorreoModal({
  open,
  onClose,
  cotizacionId,
  cliente,
  preview,
  onSuccess,
}: Props) {
  const qc = useQueryClient();
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { data: cot, isLoading } = useQuery({
    queryKey: ['cotizacion', cotizacionId],
    queryFn: () => fetchCotizacion(cotizacionId),
    enabled: open && !!cotizacionId,
    staleTime: 30_000,
  });

  const { data: smtpActivo = false } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    select: (data) => (data.meta?.smtp ?? parseSmtpEstado(data.smtp)).activo,
    staleTime: 60_000,
    enabled: open,
  });

  const codigo = cot?.codigo ?? preview?.codigo ?? '';
  const linkPublico =
    (cot ? linkPublicoCompleto(cot.tokenPublico) : preview?.linkPublico) ?? '';
  const linkPdf =
    (cot ? linkPdfPublicoCompleto(cot.tokenPublico) : preview?.linkPdfPublico) ?? '';
  const nombreCliente =
    cot?.cliente.nombreCompleto ??
    preview?.nombreCliente ??
    cliente.nombreCompleto ??
    'cliente';
  const correo = cliente.correo?.trim() ?? cot?.cliente.correo?.trim() ?? '';

  useEffect(() => {
    if (open && codigo && linkPublico) {
      setAsunto(asuntoCorreoCotizacion(codigo));
      setMensaje(mensajeCorreoCotizacion(nombreCliente, codigo, linkPublico, linkPdf || undefined));
    }
  }, [open, codigo, linkPublico, linkPdf, nombreCliente]);

  const enviarMut = useMutation({
    mutationFn: () =>
      enviarCorreoCotizacion(
        cotizacionId,
        { celular: cliente.celular, correo },
        qc,
        { asunto: asunto.trim(), cuerpo: mensaje.trim() },
      ),
    onSuccess: () => {
      onClose();
      onSuccess?.();
    },
    onError: async (err: unknown) => {
      await mostrarErrorApi(err, 'No se pudo enviar el correo', 'No se pudo enviar');
    },
  });

  const listo = !!codigo && !!linkPublico && !!correo;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Enviar cotización por correo"
      description={
        smtpActivo
          ? 'Revisa el asunto y el mensaje. Se enviará automáticamente vía SMTP.'
          : 'Revisa el asunto y el mensaje. Luego se abrirá tu cliente de correo para enviar manualmente.'
      }
      size="lg"
      nested
    >
      <div className="space-y-4">
        {!correo ? (
          <p className="text-body-sm text-error">El cliente no tiene correo registrado.</p>
        ) : (
          <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 px-3 py-2 text-body-sm">
            <span className="text-outline">Para: </span>
            <span className="font-medium text-on-surface">{correo}</span>
          </div>
        )}
        {isLoading && !codigo ? (
          <FormSkeleton fields={2} columns={1} withTextarea />
        ) : (
          <>
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
        {linkPublico ? (
          <div className="space-y-1 text-xs text-outline">
            <p>
              Link aceptar: <span className="break-all font-mono">{linkPublico}</span>
            </p>
            {linkPdf ? (
              <p>
                Link PDF: <span className="break-all font-mono">{linkPdf}</span>
              </p>
            ) : null}
          </div>
        ) : null}
          </>
        )}
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
