import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { BTN_PRIMARY, CARD_CLASS } from '../constants/design';
import { api } from '../lib/api';
import type { ContratoSnapshot } from '../lib/contrato-types';

type ContratoPublico = {
  numero: string;
  fechaEmision: string;
  montoTotal: number;
  montoAdelanto: number;
  montoPendiente: number;
  montoGarantia: number;
  adelanto1Monto: number;
  adelanto1Fecha: string | null;
  horarioInicio: string;
  horarioFin: string;
  etapa: string;
  snapshotJson: ContratoSnapshot;
  linkPublico: string;
  linkPdfPublico?: string;
};

async function fetchPublica(token: string) {
  const { data } = await api.get<ContratoPublico>(`/public/bosque-magico/contratos/${token}`);
  return data;
}

function formatFecha(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatSoles(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

export function ContratoPublicaPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contrato-publico', token],
    queryFn: () => fetchPublica(token!),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Cargando contrato…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className={`${CARD_CLASS} max-w-lg p-8 text-center`}>
          <h1 className="text-title-md text-primary">Contrato no disponible</h1>
          <p className="mt-2 text-on-surface-variant">El enlace no es válido o el contrato ya no está disponible.</p>
        </div>
      </div>
    );
  }

  const snap = data.snapshotJson;

  return (
    <>
      <Seo title={`Contrato ${data.numero}`} description="Contrato Bosque Mágico" path={`/contrato/${token ?? ''}`} />
      <div className="min-h-screen bg-background px-4 py-8 print:bg-white print:p-0">
        <div className={`mx-auto max-w-3xl ${CARD_CLASS} p-8 print:border-0 print:shadow-none`}>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 print:mb-4">
            <div>
              <p className="text-label-caps text-outline">Bosque Mágico</p>
              <h1 className="text-title-lg text-primary">Contrato {data.numero}</h1>
              <p className="text-body-sm text-on-surface-variant">
                Emisión: {formatFecha(data.fechaEmision)} · Cotización {snap.codigoCotizacion}
              </p>
              {data.etapa === 'borrador' && (
                <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-900">
                  Borrador — no válido para firmar
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Link to={`/contrato/${token}/pdf`} className={BTN_PRIMARY}>
                Imprimir / guardar PDF
              </Link>
            </div>
          </div>

          <section className="mb-6 space-y-2 text-body-sm">
            <h2 className="text-title-sm text-primary">Cliente</h2>
            <p>{snap.cliente.nombreCompleto}</p>
            <p className="text-on-surface-variant">
              {snap.cliente.celular}
              {snap.cliente.correo ? ` · ${snap.cliente.correo}` : ''}
            </p>
            <p>Cumpleañero: {snap.cumpleanero.nombre}</p>
          </section>

          <section className="mb-6 space-y-2 text-body-sm">
            <h2 className="text-title-sm text-primary">Evento</h2>
            <p>
              {formatFecha(snap.evento.fechaEvento)} · {data.horarioInicio} – {data.horarioFin}
            </p>
            <p>{snap.evento.cantidadNinos} niños · {snap.evento.tematica ?? 'Sin temática'}</p>
          </section>

          <section className="mb-6">
            <h2 className="mb-2 text-title-sm text-primary">Servicios</h2>
            <ul className="space-y-1 text-body-sm">
              {snap.cotizacion.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>
                    {item.nombre} × {item.cantidad}
                  </span>
                  <span>{formatSoles(item.subtotal)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-6 rounded-xl bg-surface-container-low p-4 text-body-sm">
            <div className="flex justify-between">
              <span>Total</span>
              <strong>{formatSoles(data.montoTotal)}</strong>
            </div>
            <div className="mt-1 flex justify-between text-on-surface-variant">
              <span>Adelanto 1</span>
              <span>
                {formatSoles(data.adelanto1Monto)}
                {data.adelanto1Fecha ? ` · ${formatFecha(data.adelanto1Fecha)}` : ''}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-on-surface-variant">
              <span>Saldo pendiente</span>
              <span>{formatSoles(data.montoPendiente)}</span>
            </div>
            <div className="mt-1 flex justify-between text-on-surface-variant">
              <span>Garantía referencial</span>
              <span>{formatSoles(data.montoGarantia)}</span>
            </div>
          </section>

          <p className="text-xs text-outline print:mt-8">
            {data.etapa === 'borrador'
              ? 'Este contrato está en borrador: todavía no es válido para firmar. Si te lo enviaron para revisar, espera la versión final o escríbenos por WhatsApp.'
              : 'Documento generado por Bosque Mágico. Puede guardarlo como PDF desde el diálogo de impresión del navegador.'}
          </p>
        </div>
      </div>
    </>
  );
}
