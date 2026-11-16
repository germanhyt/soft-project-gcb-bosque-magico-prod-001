import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { fetchConfiguracionPanel } from '../../lib/configuracion';
import {
  enviarPrecontratoCorreo,
  linkPrecontratoPublico,
  type Cotizacion,
} from '../../lib/cotizaciones';
import { linkMailto } from '../../lib/contacto-links';
import {
  asuntoCorreoPrecontrato,
  mensajePrecontrato,
} from '../../lib/mensajes-precontrato';
import { parseSmtpEstado } from '../../lib/smtp-config';
import { mostrarErrorApi } from '../../lib/swal-feedback';
import { abrirWhatsApp, waMeUrlCotizacion } from '../../lib/whatsapp-cotizacion';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

type Props = {
  cot: Cotizacion & { precontrato: NonNullable<Cotizacion['precontrato']> };
};

function abrirClienteCorreo(correo: string, asunto: string, cuerpo: string) {
  const url = linkMailto(correo, asunto, cuerpo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.rel = 'noopener noreferrer';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
}

export function EnviarPrecontratoActions({ cot }: Props) {
  const [waAbierto, setWaAbierto] = useState(false);
  const [correoAbierto, setCorreoAbierto] = useState(false);
  const [mensajeWa, setMensajeWa] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  const celular = cot.cliente.celular?.trim() ?? '';
  const correo = cot.cliente.correo?.trim() ?? '';
  const link = linkPrecontratoPublico(cot.tokenPublico);
  const texto = mensajePrecontrato({
    nombreCompleto: cot.cliente.nombreCompleto,
    codigo: cot.codigo,
    montoTotal: cot.montoTotal,
    adelanto1Monto: cot.precontrato.adelanto1Monto,
    adelanto1Fecha: cot.precontrato.adelanto1Fecha,
    adelanto2Monto: cot.precontrato.adelanto2Monto,
    adelanto2Fecha: cot.precontrato.adelanto2Fecha,
    link,
  });

  const { data: smtpActivo = false } = useQuery({
    queryKey: ['config-panel'],
    queryFn: fetchConfiguracionPanel,
    select: (data) => (data.meta?.smtp ?? parseSmtpEstado(data.smtp)).activo,
    staleTime: 60_000,
  });

  const abrirWhatsapp = () => {
    const tab = window.open('about:blank', '_blank');
    const abierto = abrirWhatsApp(waMeUrlCotizacion(celular, mensajeWa.trim()), tab);
    setWaAbierto(false);
    if (!abierto) {
      void Swal.fire({
        icon: 'info',
        title: 'Abrir WhatsApp',
        text: 'El navegador bloqueó la ventana. Permite emergentes y vuelve a intentar.',
      });
    }
  };

  const enviarCorreo = async () => {
    setEnviandoCorreo(true);
    try {
      const res = await enviarPrecontratoCorreo(cot.id, {
        correoDestino: correo,
        correoAsunto: asunto.trim(),
        correoCuerpo: cuerpo.trim(),
      });
      setCorreoAbierto(false);
      if (res.enviadoPorSmtp) {
        await Swal.fire({
          icon: 'success',
          title: 'Precontrato enviado',
          text: 'El correo salió por el servidor SMTP. La cotización sigue en su etapa.',
          timer: 2400,
          showConfirmButton: false,
        });
        return;
      }
      abrirClienteCorreo(correo, asunto.trim(), cuerpo.trim());
      await Swal.fire({
        icon: 'info',
        title: 'Cliente de correo',
        text: 'Se abrió tu aplicación de correo con el precontrato. Revisa y envía.',
        timer: 2800,
        showConfirmButton: false,
      });
    } catch (err) {
      mostrarErrorApi(err, 'No se pudo enviar el precontrato');
    } finally {
      setEnviandoCorreo(false);
    }
  };

  if (!celular && !correo) return null;

  return (
    <>
      {celular ? (
        <Button
          variant="secondary"
          className="inline-flex w-full gap-2"
          onClick={() => {
            setMensajeWa(texto);
            setWaAbierto(true);
          }}
        >
          <WhatsAppIcon size={18} />
          WhatsApp
        </Button>
      ) : null}
      {correo ? (
        <Button
          variant="secondary"
          className="inline-flex w-full gap-2"
          onClick={() => {
            setAsunto(asuntoCorreoPrecontrato(cot.codigo));
            setCuerpo(texto);
            setCorreoAbierto(true);
          }}
        >
          <Icon name="mail" size={18} />
          Correo
        </Button>
      ) : null}
      <Modal
        open={waAbierto}
        onClose={() => setWaAbierto(false)}
        title="Enviar precontrato por WhatsApp"
        description="El mensaje lleva el enlace del documento. No acepta la cotización."
        size="lg"
      >
        <label className="block">
          <span className={LABEL_CLASS}>Mensaje</span>
          <textarea
            className={`${INPUT_CLASS} min-h-[180px] resize-y`}
            value={mensajeWa}
            onChange={(e) => setMensajeWa(e.target.value)}
            rows={10}
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setWaAbierto(false)}>
            Cancelar
          </Button>
          <Button disabled={!mensajeWa.trim()} onClick={abrirWhatsapp}>
            Abrir WhatsApp
          </Button>
        </div>
      </Modal>
      <Modal
        open={correoAbierto}
        onClose={() => setCorreoAbierto(false)}
        title="Enviar precontrato por correo"
        description={
          smtpActivo
            ? 'Se envía por SMTP. La cotización no cambia de etapa.'
            : 'SMTP no está activo. Se abrirá tu programa de correo.'
        }
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-outline">Para: {correo}</p>
          <label className="block">
            <span className={LABEL_CLASS}>Asunto</span>
            <input className={INPUT_CLASS} value={asunto} onChange={(e) => setAsunto(e.target.value)} />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>Mensaje</span>
            <textarea
              className={`${INPUT_CLASS} min-h-[180px] resize-y`}
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              rows={10}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setCorreoAbierto(false)} disabled={enviandoCorreo}>
            Cancelar
          </Button>
          <Button
            disabled={!asunto.trim() || !cuerpo.trim() || enviandoCorreo}
            onClick={() => void enviarCorreo()}
          >
            {enviandoCorreo ? 'Enviando…' : smtpActivo ? 'Enviar por SMTP' : 'Abrir correo'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
