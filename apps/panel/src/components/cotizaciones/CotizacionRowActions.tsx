import { useNavigate } from 'react-router-dom';
import { linkPublicoCompleto } from '../../lib/cotizaciones';
import type { Cotizacion } from '../../lib/cotizaciones';
import { ContactoInlineActions } from '../contacto/ContactoInlineActions';
import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';
import {
  confirmarAceptacionCotizacion,
  useAceptarCotizacionMutation,
} from './AceptarCotizacionAction';
import { useEnviarCotizacionMutation } from './EnviarCotizacionActions';

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
  const enviarMut = useEnviarCotizacionMutation(cotizacion.id, cotizacion.cliente);
  const aceptarMut = useAceptarCotizacionMutation(cotizacion.id);

  return (
    <RowActionsToolbar>
      <ContactoInlineActions
        nombre={cotizacion.cliente.nombreCompleto}
        celular={cotizacion.cliente.celular}
        correo={cotizacion.cliente.correo}
        enlaceCopiar={linkPublico}
        enlaceTitulo="Copiar link público de cotización"
      />
      {puedeEnviar && (
        <RowIconButton
          icon="send"
          title="Enviar por WhatsApp"
          aria-label="Enviar por WhatsApp"
          disabled={enviarMut.isPending}
          onClick={() => enviarMut.mutate('whatsapp')}
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
          icon="edit"
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
  );
}
