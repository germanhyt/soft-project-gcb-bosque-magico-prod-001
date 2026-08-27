import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { Button } from '../ui/Button';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';
import { marcarContratoEnviado, type Contrato, type EtapaContrato } from '../../lib/contratos';
import { mensajeWhatsAppContrato } from '../../lib/whatsapp-contrato';
import { abrirWhatsApp, waMeUrlCotizacion } from '../../lib/whatsapp-cotizacion';
import { Modal } from '../ui/Modal';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { Icon } from '../ui/Icon';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import { enviarCorreoContrato } from '../../lib/enviar-contrato-correo';
import {
  asuntoCorreoContrato,
  mensajeCorreoContrato,
} from '../../lib/mensajes-contrato-correo';
import { parseSmtpEstado } from '../../lib/smtp-config';
import { mostrarErrorApi } from '../../lib/swal-feedback';

type Props = {
  contrato: Contrato;
  celular: string;
  correo?: string;
  className?: string;
  onSuccess?: () => void;
};

export function EnviarContratoActions({
  contrato,
  celular,
  correo,
  className = '',
  onSuccess,
}: Props) {
  const qc = useQueryClient();
  const [enviandoWa, setEnviandoWa] = useState(false);
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [correoModalOpen, setCorreoModalOpen] = useState(false);
  const [mensajeWa, setMensajeWa] = useState('');
  const [asuntoCorreo, setAsuntoCorreo] = useState('');
  const [mensajeCorreo, setMensajeCorreo] = useState('');
  const puedeEnviar =
    contrato.etapa === 'borrador' || contrato.etapa === 'enviado';
  const correoDestino = correo?.trim() ?? contrato.snapshotJson?.cliente?.correo?.trim() ?? '';

  const { data: smtpActivo = false } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    select: (data) => (data.meta?.smtp ?? parseSmtpEstado(data.smtp)).activo,
    staleTime: 60_000,
  });

  const invalidar = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['contrato', contrato.id] }),
      qc.invalidateQueries({ queryKey: ['contratos'] }),
      qc.invalidateQueries({ queryKey: ['contrato-evento', contrato.eventoId] }),
    ]);
  };

  const enviarWhatsApp = async () => {
    setEnviandoWa(true);
    const waTab = window.open('about:blank', '_blank');
    try {
      if (contrato.etapa === 'borrador') {
        await marcarContratoEnviado(contrato.id);
        await invalidar();
      }

      const waUrl = waMeUrlCotizacion(celular, mensajeWa.trim());
      const abierto = abrirWhatsApp(waUrl, waTab);
      if (!abierto) {
        await Swal.fire({
          icon: 'info',
          title: 'Abrir WhatsApp',
          html: `<p class="text-sm mb-3">El navegador bloqueó la ventana emergente.</p><a href="${waUrl}" target="_blank" rel="noopener" class="text-primary underline">Abrir WhatsApp manualmente</a>`,
        });
      }

      await Swal.fire({
        icon: 'success',
        title: contrato.etapa === 'borrador' ? 'Contrato enviado' : 'WhatsApp abierto',
        html: '<p class="text-sm">WhatsApp abierto con el mensaje del contrato.</p>',
        timer: 2400,
        showConfirmButton: false,
      });
      setWaModalOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      waTab?.close();
      await mostrarErrorApi(err, 'No se pudo enviar por WhatsApp', 'No se pudo enviar');
    } finally {
      setEnviandoWa(false);
    }
  };

  const enviarCorreo = async () => {
    if (!correoDestino) return;
    setEnviandoCorreo(true);
    try {
      await enviarCorreoContrato(contrato, qc, {
        correoDestino,
        asunto: asuntoCorreo,
        cuerpo: mensajeCorreo,
      });
      setCorreoModalOpen(false);
      onSuccess?.();
    } catch (err: unknown) {
      await mostrarErrorApi(err, 'No se pudo enviar el correo', 'No se pudo enviar el correo');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  if (!puedeEnviar) return null;

  const pendiente = enviandoWa || enviandoCorreo;
  const etapa = contrato.etapa as EtapaContrato;

  return (
    <>
      <div className={`col-span-2 grid grid-cols-1 gap-2 sm:grid-cols-2 ${className}`}>
        <Button
          className="inline-flex gap-2"
          disabled={pendiente}
          onClick={() => {
            setMensajeWa(mensajeWhatsAppContrato(contrato));
            setWaModalOpen(true);
          }}
        >
          <WhatsAppIcon size={20} className="text-on-primary" />
          {etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp'}
        </Button>
        {correoDestino && (
          <Button
            variant="secondary"
            className="inline-flex gap-2"
            disabled={pendiente}
            onClick={() => {
              const link = contrato.linkPublico || contrato.tokenPublico;
              const linkPdf = contrato.linkPdfPublico || contrato.tokenPublico;
              const nombreCliente = contrato.snapshotJson?.cliente?.nombreCompleto ?? 'cliente';
              setAsuntoCorreo(asuntoCorreoContrato(contrato.numero));
              setMensajeCorreo(
                mensajeCorreoContrato(nombreCliente, contrato.numero, link, linkPdf),
              );
              setCorreoModalOpen(true);
            }}
            title={
              smtpActivo
                ? 'Revisar mensaje y enviar vía SMTP'
                : 'Revisar mensaje y abrir tu cliente de correo'
            }
          >
            <Icon name="mail" size={20} />
            {etapa === 'borrador' ? 'Enviar por correo' : 'Reenviar por correo'}
          </Button>
        )}
      </div>
      <Modal
        open={waModalOpen}
        onClose={() => setWaModalOpen(false)}
        title="Enviar contrato por WhatsApp"
        description="Revisa el mensaje antes de abrir WhatsApp."
        size="lg"
        nested
      >
        <div className="space-y-4">
          <label className="block">
            <span className={LABEL_CLASS}>Mensaje</span>
            <textarea
              className={`${INPUT_CLASS} min-h-[180px] resize-y`}
              value={mensajeWa}
              onChange={(ev) => setMensajeWa(ev.target.value)}
              rows={10}
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setWaModalOpen(false)}
            disabled={enviandoWa}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="inline-flex gap-2"
            disabled={!mensajeWa.trim() || enviandoWa}
            onClick={() => void enviarWhatsApp()}
          >
            <WhatsAppIcon size={20} className="text-on-primary" />
            {enviandoWa ? 'Abriendo…' : 'Abrir WhatsApp'}
          </Button>
        </div>
      </Modal>
      <Modal
        open={correoModalOpen}
        onClose={() => setCorreoModalOpen(false)}
        title="Enviar contrato por correo"
        description={
          smtpActivo
            ? 'Revisa el asunto y el mensaje. Se enviará automáticamente vía SMTP.'
            : 'Revisa el asunto y el mensaje. Luego se abrirá tu cliente de correo para enviar manualmente.'
        }
        size="lg"
        nested
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 px-3 py-2 text-body-sm">
            <span className="text-outline">Para: </span>
            <span className="font-medium text-on-surface">{correoDestino}</span>
          </div>
          {!smtpActivo ? (
            <p className="text-body-sm text-outline">
              SMTP no está activo en Configuración. El envío abrirá Outlook u otro cliente de correo.
            </p>
          ) : null}
          <label className="block">
            <span className={LABEL_CLASS}>Asunto</span>
            <input
              className={INPUT_CLASS}
              value={asuntoCorreo}
              onChange={(e) => setAsuntoCorreo(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Mensaje</span>
            <textarea
              className={`${INPUT_CLASS} min-h-[180px] resize-y`}
              value={mensajeCorreo}
              onChange={(e) => setMensajeCorreo(e.target.value)}
              rows={10}
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCorreoModalOpen(false)}
            disabled={enviandoCorreo}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="inline-flex gap-2"
            disabled={!asuntoCorreo.trim() || !mensajeCorreo.trim() || enviandoCorreo}
            onClick={() => void enviarCorreo()}
          >
            <Icon name="mail" size={20} />
            {enviandoCorreo
              ? smtpActivo
                ? 'Enviando…'
                : 'Abriendo…'
              : smtpActivo
                ? 'Enviar por SMTP'
                : 'Abrir correo y enviar'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
