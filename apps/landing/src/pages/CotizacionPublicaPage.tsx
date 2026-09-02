import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import type { CotizacionPrintData } from '@bosque/shared';
import { Seo } from '../components/Seo';
import { ServiciosListado } from '../components/cotizador/ServiciosListado';
import { BTN_PRIMARY, CARD_CLASS, SWAL_CONFIRM_COLOR } from '../constants/design';
import { SEO_COTIZACION } from '../constants/seo';
import { api } from '../lib/api';

type CotizacionPublica = {
  codigo: string;
  turno: string;
  fechaEvento: string;
  cantidadNinos: number;
  paquete?: string | null;
  tematica?: string | null;
  notas?: string | null;
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  etapa: CotizacionPrintData['etapa'];
  puedeAceptar: boolean;
  cliente: { nombreCompleto: string };
  cumpleanero: { nombre: string; edad?: number | null };
  items?: CotizacionPrintData['items'];
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
        <img src="/logo-bm.png" alt="Bosque Mágico" className="mx-auto h-28 w-28 object-contain" />
        <h1 className="mt-4 text-center font-display text-headline-lg text-primary">Tu cotización</h1>
        <p className="text-center text-sm text-on-surface-variant">{data.codigo}</p>
        {data.etapa === 'borrador' && (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-900">
            Borrador — no válida para aceptar
          </p>
        )}
        <p className="mt-4 text-center text-on-surface">
          Hola <strong>{data.cliente.nombreCompleto}</strong>, propuesta para la fiesta de{' '}
          <strong>{data.cumpleanero.nombre}</strong>
        </p>

        {data.items && data.items.length > 0 ? (
          <div className="mt-6">
            <ServiciosListado
              cot={{
                codigo: data.codigo,
                etapa: data.etapa,
                fechaEvento: data.fechaEvento,
                turno: data.turno,
                cantidadNinos: data.cantidadNinos,
                paquete: data.paquete,
                tematica: data.tematica,
                notas: data.notas,
                montoBase: data.montoBase,
                montoNinosExtra: data.montoNinosExtra,
                montoItems: data.montoItems,
                montoTotal: data.montoTotal,
                cliente: { nombreCompleto: data.cliente.nombreCompleto, celular: '' },
                cumpleanero: data.cumpleanero,
                items: data.items,
              }}
            />
          </div>
        ) : null}

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Paquete / tarifa base</dt>
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
              <dt>Adicionales y excedentes</dt>
              <dd>S/ {data.montoItems.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-surface-variant pt-2 text-lg font-bold text-primary">
            <dt>Total</dt>
            <dd>S/ {data.montoTotal.toFixed(2)}</dd>
          </div>
        </dl>

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
                ? 'Esta es una propuesta en borrador: todavía no se puede aceptar en línea. Si te la enviaron para revisar, espera la versión final o escríbenos por WhatsApp.'
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
