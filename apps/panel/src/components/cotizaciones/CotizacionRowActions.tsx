import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { linkPublicoCompleto } from '../../lib/cotizaciones';
import type { Cotizacion } from '../../lib/cotizaciones';
import { ContactoInlineActions } from '../contacto/ContactoInlineActions';
import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import {
  confirmarAceptacionCotizacion,
  useAceptarCotizacionMutation,
} from './AceptarCotizacionAction';
import { EnviarCotizacionCorreoModal } from './EnviarCotizacionCorreoModal';
import { enviarWhatsAppRapido } from './EnviarCotizacionActions';

type Props = {
  cotizacion: Cotizacion;
  onVer?: (id: string) => void;
  onEditar?: (id: string) => void;
};

export function CotizacionRowActions({ cotizacion, onVer, onEditar }: Props) {
  const navigate = useNavigate();
  const linkPublico = linkPublicoCompleto(cotizacion.tokenPublico);
  const puedeEnviar =
    cotizacion.etapa === 'borrador' || cotizacion.etapa === 'enviada';
  const qc = useQueryClient();
  const [correoModalOpen, setCorreoModalOpen] = useState(false);
  const enviarWaMut = useMutation({
    mutationFn: () => enviarWhatsAppRapido(cotizacion.id, cotizacion.cliente, qc),
    onError: async () => {
      await Swal.fire({ icon: 'error', title: 'No se pudo enviar por WhatsApp' });
    },
  });
  const aceptarMut = useAceptarCotizacionMutation(cotizacion.id);

  return (
    <>
    <RowActionsToolbar>
      <ContactoInlineActions
        nombre={cotizacion.cliente.nombreCompleto}
        celular={cotizacion.cliente.celular}
        correo={cotizacion.cliente.correo}
        enlaceCopiar={linkPublico}
        enlaceTitulo="Copiar link público de cotización"
        ocultarCorreo
      />
      {puedeEnviar && cotizacion.cliente.correo && (
        <RowIconButton
          icon="mail"
          title="Enviar cotización por correo"
          aria-label="Enviar cotización por correo"
          onClick={() => setCorreoModalOpen(true)}
        />
      )}
      {puedeEnviar && (
        <RowIconButton
          icon="send"
          title="Enviar por WhatsApp"
          aria-label="Enviar por WhatsApp"
          disabled={enviarWaMut.isPending}
          onClick={() => enviarWaMut.mutate()}
        />
      )}
      {cotizacion.etapa === 'enviada' && (
        <RowIconButton
          icon="check_circle"
          title="Aceptar (equipo)"
          aria-label="Aceptar cotización"
          disabled={aceptarMut.isPending}
          onClick={() => {
            void (async () => {
              if (await confirmarAceptacionCotizacion()) aceptarMut.mutate();
            })();
          }}
        />
      )}
      {cotizacion.etapa === 'borrador' && (
        <RowIconButton
          icon="edit_square"
          title="Editar borrador"
          aria-label="Editar borrador"
          onClick={() =>
            onEditar ? onEditar(cotizacion.id) : navigate(`/cotizaciones?editar=${cotizacion.id}`)
          }
        />
      )}
      <RowIconButton
        icon="visibility"
        title="Ver cotización"
        aria-label="Ver cotización"
        onClick={() =>
          onVer ? onVer(cotizacion.id) : navigate(`/cotizaciones?detalle=${cotizacion.id}`)
        }
      />
      {cotizacion.solicitudId && (
        <RowIconButton
          icon="inbox"
          title="Solicitud origen"
          aria-label="Ir a solicitudes"
          onClick={() => navigate('/solicitudes')}
        />
      )}
    </RowActionsToolbar>
    <EnviarCotizacionCorreoModal
      open={correoModalOpen}
      onClose={() => setCorreoModalOpen(false)}
      cotizacionId={cotizacion.id}
      cliente={cotizacion.cliente}
      preview={{
        codigo: cotizacion.codigo,
        linkPublico,
        nombreCliente: cotizacion.cliente.nombreCompleto,
      }}
    />
    </>
  );
}
