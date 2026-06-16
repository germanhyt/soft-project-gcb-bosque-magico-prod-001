import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Seo } from '../components/Seo';
import { BTN_PRIMARY, CARD_CLASS, SWAL_CONFIRM_COLOR } from '../constants/design';
import { SEO_COTIZACION } from '../constants/seo';
import { api } from '../lib/api';

type CotizacionPublica = {
  codigo: string;
  fechaEvento: string;
  turno: string;
  cantidadNinos: number;
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  etapa: string;
  puedeAceptar: boolean;
  cliente: { nombreCompleto: string };
  cumpleanero: { nombre: string; edad?: number | null };
  items?: { nombre: string; cantidad: number; subtotal: number }[];
};

async function fetchPublica(token: string) {
  const { data } = await api.get<CotizacionPublica>(`/public/bosque-magico/cotizaciones/${token}`);
  return data;
}

async function aceptarPublica(token: string) {
  const { data } = await api.post(`/public/bosque-magico/cotizaciones/${token}/aceptar`);
  return data;
}

export function CotizacionPublicaPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cotizacion-publica', token],
    queryFn: () => fetchPublica(token!),
    enabled: !!token,
  });

  const aceptar = useMutation({
    mutationFn: () => aceptarPublica(token!),
    onSuccess: async (res: { mensaje?: string }) => {
      await Swal.fire({
        icon: 'success',
        title: '¡Gracias!',
        text: res.mensaje ?? 'Cotización aceptada. Te contactaremos para confirmar.',
        confirmButtonColor: SWAL_CONFIRM_COLOR,
      });
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : '';
      await Swal.fire({ icon: 'error', title: 'No se pudo aceptar', text: msg || undefined });
    },
  });

  const seoCotizacion = (
    <Seo
      title={SEO_COTIZACION.title}
      description={SEO_COTIZACION.description}
      path={`/cotizacion/${token ?? ''}`}
      robots={SEO_COTIZACION.robots}
    />
  );

  if (isLoading) {
    return (
      <>
        {seoCotizacion}
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-on-surface-variant">Cargando cotización…</p>
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        {seoCotizacion}
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <p className="text-center text-error">Cotización no encontrada o enlace inválido.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {seoCotizacion}
    <div className="min-h-screen bg-background px-4 py-12">
      <div className={`mx-auto max-w-lg p-8 ${CARD_CLASS}`}>
        <img src="/logo-bm.png" alt="Bosque Mágico" className="mx-auto h-16 w-16" />
        <h1 className="mt-4 text-center font-display text-headline-lg text-primary">Tu cotización</h1>
        <p className="text-center text-sm text-on-surface-variant">{data.codigo}</p>
        <p className="mt-4 text-center text-on-surface">
          Hola <strong>{data.cliente.nombreCompleto}</strong>, propuesta para la fiesta de{' '}
          <strong>{data.cumpleanero.nombre}</strong>
        </p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Tarifa base</dt>
            <dd>S/ {data.montoBase.toFixed(2)}</dd>
          </div>
          {data.montoNinosExtra > 0 && (
            <div className="flex justify-between">
              <dt>Niños adicionales</dt>
              <dd>S/ {data.montoNinosExtra.toFixed(2)}</dd>
            </div>
          )}
          {data.montoItems > 0 && (
            <div className="flex justify-between">
              <dt>Servicios</dt>
              <dd>S/ {data.montoItems.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-surface-variant pt-2 text-price-tag text-primary">
            <dt>Total</dt>
            <dd>S/ {data.montoTotal.toFixed(2)}</dd>
          </div>
        </dl>

        {data.items && data.items.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-outline">
            {data.items.map((i, idx) => (
              <li key={idx}>
                {i.nombre} × {i.cantidad}
              </li>
            ))}
          </ul>
        )}

        {data.puedeAceptar ? (
          <button
            type="button"
            disabled={aceptar.isPending}
            onClick={() => aceptar.mutate()}
            className={`${BTN_PRIMARY} mt-8 w-full`}
          >
            {aceptar.isPending ? 'Procesando…' : 'Aceptar cotización'}
          </button>
        ) : (
          <p className="mt-6 text-center text-sm text-on-surface-variant">
            {data.etapa === 'aceptada'
              ? 'Esta cotización ya fue aceptada. El equipo Bosque Mágico te contactará para confirmar los detalles finales.'
              : data.etapa === 'borrador'
                ? 'Esta propuesta aún no está disponible para aceptar en línea. Si tienes dudas, escríbenos por WhatsApp.'
                : data.etapa === 'cerrada'
                  ? 'Esta cotización ya no está activa. Contáctanos si deseas una nueva propuesta.'
                  : 'Esta cotización ya no admite aceptación en línea. Contáctanos para más información.'}
          </p>
        )}

        <a
          href={`/cotizacion/${token}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center text-sm font-semibold text-primary underline print:hidden"
        >
          Ver / descargar PDF
        </a>
      </div>
    </div>
    </>
  );
}
