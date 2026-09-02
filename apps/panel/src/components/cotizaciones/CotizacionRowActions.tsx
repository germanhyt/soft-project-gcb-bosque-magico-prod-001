import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiErrorMessage } from '../../lib/api-error';
import {
  linkPdfPublicoCompleto,
  linkPublicoCompleto,
  volverCotizacionABorrador,
  type Cotizacion,
} from '../../lib/cotizaciones';
import { RowActionDivider, RowActionsToolbar } from '../ui/RowActionsToolbar';
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
  const linkPdf = linkPdfPublicoCompleto(cotizacion.tokenPublico);
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
  const volverMut = useMutation({
    mutationFn: () => volverCotizacionABorrador(cotizacion.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['cotizaciones'] });
      await qc.invalidateQueries({ queryKey: ['cotizacion', cotizacion.id] });
      await Swal.fire({
        icon: 'success',
        title: 'Volvió a borrador',
        text: 'El cliente ya no puede aceptar hasta que reenvíes.',
      });
    },
    onError: async (err) => {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo volver a borrador',
        text: apiErrorMessage(err, 'Inténtalo de nuevo'),
      });
    },
  });

  const labelEnviarWa =
    cotizacion.etapa === 'borrador' ? 'Enviar por WhatsApp' : 'Reenviar por WhatsApp';
  const labelEnviarCorreo =
    cotizacion.etapa === 'borrador'
      ? 'Enviar cotización por correo'
      : 'Reenviar cotización por correo';

  return (
    <>
      <RowActionsToolbar>
        <RowIconButton
          icon="visibility"
          title="Ver cotización"
          aria-label="Ver cotización"
          onClick={() =>
            onVer ? onVer(cotizacion.id) : navigate(`/cotizaciones?detalle=${cotizacion.id}`)
          }
        />
        {cotizacion.etapa === 'borrador' && (
          <RowIconButton
            icon="edit_square"
            title="Editar borrador"
            aria-label="Editar borrador"
            onClick={() =>
              onEditar
                ? onEditar(cotizacion.id)
                : navigate(`/cotizaciones?editar=${cotizacion.id}`)
            }
          />
        )}

        {/* Envío al cliente */}
        {puedeEnviar && (
          <>
            <RowActionDivider />
            <RowIconButton
              icon="send"
              title={labelEnviarWa}
              aria-label={labelEnviarWa}
              disabled={enviarWaMut.isPending}
              onClick={() => enviarWaMut.mutate()}
            />
            {cotizacion.cliente.correo && (
              <RowIconButton
                icon="mail"
                title={labelEnviarCorreo}
                aria-label={labelEnviarCorreo}
                onClick={() => setCorreoModalOpen(true)}
              />
            )}
          </>
        )}

        {/* Confirmación interna */}
        {cotizacion.etapa === 'enviada' && (
          <>
            <RowActionDivider />
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
            <RowIconButton
              icon="undo"
              title="Volver a borrador"
              aria-label="Volver a borrador"
              disabled={volverMut.isPending}
              onClick={() => {
                void (async () => {
                  const ok = await Swal.fire({
                    icon: 'question',
                    title: '¿Volver a borrador?',
                    text: 'El cliente dejará de poder aceptar. El mismo enlace se actualizará cuando reenvíes.',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, volver a borrador',
                    cancelButtonText: 'Cancelar',
                  });
                  if (ok.isConfirmed) volverMut.mutate();
                })();
              }}
            />
          </>
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
          linkPdfPublico: linkPdf,
          nombreCliente: cotizacion.cliente.nombreCompleto,
        }}
      />
    </>
  );
}
