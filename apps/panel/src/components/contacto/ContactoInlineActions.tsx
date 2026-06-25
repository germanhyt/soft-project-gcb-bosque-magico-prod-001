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
  enlaceCopiarSecundario?: string;
  enlaceTituloSecundario?: string;
  /** Ocultar correo genérico (p. ej. cotizaciones usan envío de cotización) */
  ocultarCorreo?: boolean;
  /** Ocultar WA genérico (p. ej. cotizaciones tienen «Enviar por WhatsApp») */
  ocultarWhatsApp?: boolean;
};

export function ContactoInlineActions({
  nombre,
  celular,
  correo,
  enlaceCopiar,
  enlaceTitulo = 'Copiar enlace',
  enlaceCopiarSecundario,
  enlaceTituloSecundario = 'Copiar enlace',
  ocultarCorreo = false,
  ocultarWhatsApp = false,
}: Props) {
  const [waOpen, setWaOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);

  const copiar = async (texto: string, tituloOk = 'Copiado') => {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      await Swal.fire({
        icon: 'success',
        title: tituloOk,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {
      await Swal.fire({
        icon: 'info',
        title: enlaceTitulo,
        html: `<p class="text-sm break-all">${texto}</p>`,
      });
    }
  };

  return (
    <>
      {!ocultarWhatsApp && (
        <RowIconButton
          variant="whatsapp"
          whatsapp
          title="Contactar por WhatsApp"
          aria-label="Contactar por WhatsApp"
          onClick={() => setWaOpen(true)}
        />
      )}
      {!ocultarCorreo && (
        <RowIconButton
          icon="mail"
          title={correo ? 'Contactar por correo' : 'Sin correo registrado'}
          aria-label="Contactar por correo"
          disabled={!correo}
          onClick={() => correo && setMailOpen(true)}
        />
      )}
      {/* {enlaceCopiar && (
        <RowIconButton
          icon="link"
          title={enlaceTitulo}
          aria-label={enlaceTitulo}
          onClick={() => void copiar(enlaceCopiar, 'Link copiado')}
        />
      )} */}
      {enlaceCopiarSecundario && (
        <RowIconButton
          icon="description"
          title={enlaceTituloSecundario}
          aria-label={enlaceTituloSecundario}
          onClick={() => void copiar(enlaceCopiarSecundario, 'Link PDF copiado')}
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
