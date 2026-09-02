import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { buildCotizacionPrintHtml, type CotizacionPrintData } from '@bosque/shared';
import { Seo } from '../components/Seo';
import { BTN_PRIMARY } from '../constants/design';
import { SEO_COTIZACION } from '../constants/seo';
import { api } from '../lib/api';

type CotizacionPublica = {
  codigo: string;
  fechaEvento: string;
  turno: string;
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
  cliente: { nombreCompleto: string; celular?: string | null; correo?: string | null };
  cumpleanero: { nombre: string; edad?: number | null };
  items?: {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    origenItem?: string;
    subtipo?: string | null;
    unidadesPack?: number | null;
    notas?: string | null;
  }[];
};

async function fetchPublica(token: string) {
  const { data } = await api.get<CotizacionPublica>(`/public/bosque-magico/cotizaciones/${token}`);
  return data;
}

function toPrintData(data: CotizacionPublica): CotizacionPrintData {
  return {
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
    cliente: {
      nombreCompleto: data.cliente.nombreCompleto,
      celular: data.cliente.celular ?? '',
      correo: data.cliente.correo,
    },
    cumpleanero: data.cumpleanero,
    items: data.items,
  };
}

export function CotizacionPdfPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cotizacion-publica-pdf', token],
    queryFn: () => fetchPublica(token!),
    enabled: !!token,
  });

  const printHtml = useMemo(() => {
    if (!data || !token) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return buildCotizacionPrintHtml(toPrintData(data), {
      logoUrl: `${origin}/logo-bm.png`,
      acceptLink: data.puedeAceptar ? `${origin}/cotizacion/${token}` : undefined,
      autoPrint,
    });
  }, [autoPrint, data, token]);

  useEffect(() => {
    if (!autoPrint || !printHtml) return;
    const t = window.setTimeout(() => {
      iframeRef.current?.contentWindow?.print();
    }, 600);
    return () => window.clearTimeout(t);
  }, [autoPrint, printHtml]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Cargando cotización…</p>
      </div>
    );
  }

  if (isError || !data || !printHtml) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-center text-error">Cotización no encontrada o enlace inválido.</p>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`PDF ${data.codigo}`}
        description={SEO_COTIZACION.description}
        path={`/cotizacion/${token ?? ''}/pdf`}
        robots={SEO_COTIZACION.robots}
      />
      <div className="flex min-h-screen flex-col bg-neutral-100 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-variant bg-surface-container-lowest px-4 py-3">
          <p className="text-sm font-semibold text-primary">Cotización {data.codigo}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => iframeRef.current?.contentWindow?.print()}
            >
              Imprimir / guardar PDF
            </button>
            {data.puedeAceptar && token ? (
              <Link
                to={`/cotizacion/${token}`}
                className="inline-flex items-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary"
              >
                Aceptar en línea
              </Link>
            ) : null}
          </div>
        </div>
        <iframe
          ref={iframeRef}
          title={`Cotización ${data.codigo}`}
          srcDoc={printHtml}
          className="min-h-0 flex-1 w-full border-0 bg-white"
        />
      </div>
    </>
  );
}
