import { useState } from 'react';
import Swal from 'sweetalert2';
import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import { ContactarCorreoModal } from './ContactarCorreoModal';
import { ContactarWhatsAppModal } from './ContactarWhatsAppModal';

export type ContactoInlineTarget = {
  nombre: string;
  celular: string;
  correo?: string | null;
};

type Props = ContactoInlineTarget & {
  /** Texto o URL a copiar con el botón de enlace */
  enlaceCopiar?: string;
  enlaceTitulo?: string;
};

export function ContactoInlineActions({
  nombre,
  celular,
  correo,
  enlaceCopiar,
  enlaceTitulo = 'Copiar enlace',
}: Props) {
  const [waOpen, setWaOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);

  const copiar = async () => {
    if (!enlaceCopiar) return;
    try {
      await navigator.clipboard.writeText(enlaceCopiar);
      await Swal.fire({
        icon: 'success',
        title: 'Copiado',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({
        icon: 'info',
        title: enlaceTitulo,
        html: `<p class="text-sm break-all">${enlaceCopiar}</p>`,
      });
    }
  };

  return (
    <>
      <RowIconButton
        variant="whatsapp"
        whatsapp
        title="Contactar por WhatsApp"
        aria-label="Contactar por WhatsApp"
        onClick={() => setWaOpen(true)}
      />
      <RowIconButton
        icon="mail"
        title={correo ? 'Contactar por correo' : 'Sin correo registrado'}
        aria-label="Contactar por correo"
        disabled={!correo}
        onClick={() => correo && setMailOpen(true)}
      />
      {enlaceCopiar && (
        <RowIconButton
          icon="link"
          title={enlaceTitulo}
          aria-label={enlaceTitulo}
          onClick={() => void copiar()}
        />
      )}
      <ContactarWhatsAppModal
        open={waOpen}
        onClose={() => setWaOpen(false)}
        nombre={nombre}
        celular={celular}
      />
      {correo && (
        <ContactarCorreoModal
          open={mailOpen}
          onClose={() => setMailOpen(false)}
          nombre={nombre}
          correo={correo}
        />
      )}
    </>
  );
}

/** WA + correo + enlace opcional, agrupados para combinar con más iconos. */
export function ContactoInlineActionsGroup(props: Props) {
  return (
    <RowActionsToolbar>
      <ContactoInlineActions {...props} />
    </RowActionsToolbar>
  );
}
