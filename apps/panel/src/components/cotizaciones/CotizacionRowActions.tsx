import { useNavigate } from 'react-router-dom';
import { linkPublicoCompleto } from '../../lib/cotizaciones';
import type { Cotizacion } from '../../lib/cotizaciones';
import { ContactoInlineActions } from '../contacto/ContactoInlineActions';
import { RowActionsToolbar } from '../ui/RowActionsToolbar';
import { RowIconButton } from '../ui/RowIconButton';

type Props = {
  cotizacion: Cotizacion;
  onVer?: (id: string) => void;
  onEditar?: (id: string) => void;
};

export function CotizacionRowActions({ cotizacion, onVer, onEditar }: Props) {
  const navigate = useNavigate();
  const linkPublico = linkPublicoCompleto(cotizacion.tokenPublico);

  return (
    <RowActionsToolbar>
      <ContactoInlineActions
        nombre={cotizacion.cliente.nombreCompleto}
        celular={cotizacion.cliente.celular}
        correo={cotizacion.cliente.correo}
        enlaceCopiar={linkPublico}
        enlaceTitulo="Copiar link público de cotización"
      />
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
