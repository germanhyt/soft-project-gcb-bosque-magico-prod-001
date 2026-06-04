import { useEffect, useState } from 'react';
import { INPUT_CLASS, LABEL_CLASS } from '../../constants/design';
import { linkWaMe } from '../../lib/contacto-links';
import { mensajeWhatsAppCliente } from '../../lib/mensajes-contacto';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

type Props = {
  open: boolean;
  onClose: () => void;
  nombre: string;
  celular: string;
};

export function ContactarWhatsAppModal({ open, onClose, nombre, celular }: Props) {
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (open) setMensaje(mensajeWhatsAppCliente(nombre));
  }, [open, nombre]);

  const abrirWhatsApp = () => {
    window.open(linkWaMe(celular, mensaje), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Contactar por WhatsApp"
      description="Revisá el mensaje antes de abrir wa.me."
      size="lg"
    >
      <label className="block">
        <span className={LABEL_CLASS}>Mensaje</span>
        <textarea
          className={`${INPUT_CLASS} min-h-[140px] resize-y`}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={6}
        />
      </label>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          className="inline-flex gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a]"
          onClick={abrirWhatsApp}
          disabled={!mensaje.trim()}
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
