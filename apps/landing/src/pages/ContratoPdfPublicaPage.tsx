import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  buildContratoPrintHtml,
  contratoToPrintPayload,
  type ContratoSnapshotJson,
} from '@bosque/shared';
import { Seo } from '../components/Seo';
import { BTN_PRIMARY } from '../constants/design';
import { api } from '../lib/api';

type ContratoPublico = {
  numero: string;
  fechaEmision: string;
  montoTotal: number;
  montoAdelanto: number;
  montoPendiente: number;
  montoGarantia: number;
  adelanto1Monto: number;
  adelanto1Fecha: string | null;
  adelanto2Monto: number | null;
  adelanto2Fecha: string | null;
  tipoComprobante: 'boleta' | 'factura';
  documentoTributario: string;
  numeroDocumento: string;
  horarioInicio: string;
  horarioFin: string;
  snapshotJson: ContratoSnapshotJson;
  linkPublico: string;
};

async function fetchPublica(token: string) {
  const { data } = await api.get<ContratoPublico>(`/public/bosque-magico/contratos/${token}`);
  return data;
}

export function ContratoPdfPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === '1';
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contrato-publico-pdf', token],
    queryFn: () => fetchPublica(token!),
    enabled: !!token,
  });

  const printHtml = useMemo(() => {
    if (!data || !token) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const payload = contratoToPrintPayload(data);
    return buildContratoPrintHtml(payload, {
      logoUrl: `${origin}/logo-bm.png`,
      viewLink: `${origin}/contrato/${token}`,
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
        <p className="text-on-surface-variant">Cargando contrato…</p>
      </div>
    );
  }

  if (isError || !data || !printHtml) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-center text-error">Contrato no encontrado o enlace inválido.</p>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`PDF ${data.numero}`}
        description="Contrato Bosque Mágico"
        path={`/contrato/${token ?? ''}/pdf`}
      />
      <div className="flex min-h-screen flex-col bg-neutral-100 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-variant bg-surface-container-lowest px-4 py-3">
          <p className="text-sm font-semibold text-primary">Contrato {data.numero}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={() => iframeRef.current?.contentWindow?.print()}
            >
              Imprimir / guardar PDF
            </button>
            {token ? (
              <Link
                to={`/contrato/${token}`}
                className="inline-flex items-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary"
              >
                Ver resumen en línea
              </Link>
            ) : null}
          </div>
        </div>
        <iframe
          ref={iframeRef}
          title={`Contrato ${data.numero}`}
          srcDoc={printHtml}
          className="min-h-0 flex-1 w-full border-0 bg-white"
        />
      </div>
    </>
  );
}
