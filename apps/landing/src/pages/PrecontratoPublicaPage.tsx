import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { buildContratoPrintHtml, type ContratoPrintPayload } from '@bosque/shared';
import { Seo } from '../components/Seo';
import { BTN_PRIMARY } from '../constants/design';
import { SEO_COTIZACION } from '../constants/seo';
import { api } from '../lib/api';

type PrecontratoPublico = {
  adelanto1Monto: number;
  adelanto1Fecha: string;
  adelanto2Monto?: number;
  adelanto2Fecha?: string;
  montoGarantia?: number;
};

type CotizacionPublica = {
  codigo: string;
  fechaEvento: string;
  turno: string;
  horarioInicio?: string | null;
  horarioFin?: string | null;
  cantidadNinos: number;
  paquete?: string | null;
  tematica?: string | null;
  montoBase: number;
  montoNinosExtra: number;
  montoItems: number;
  montoTotal: number;
  extrasPermitidos?: string[] | null;
  extrasPermitidosComentario?: string | null;
  precontrato?: PrecontratoPublico | null;
  cliente: {
    nombreCompleto: string;
    celular?: string | null;
    correo?: string | null;
  };
  cumpleanero: { nombre: string; edad?: number | null };
  items?: ContratoPrintPayload['cotizacion']['items'];
};

async function fetchPublica(token: string) {
  const { data } = await api.get<CotizacionPublica>(`/public/bosque-magico/cotizaciones/${token}`);
  return data;
}

function fechaClave(value: string) {
  return value.slice(0, 10);
}

export function PrecontratoPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['precontrato-publico', token],
    queryFn: () => fetchPublica(token!),
    enabled: !!token,
  });

  const printHtml = useMemo(() => {
    if (!data?.precontrato || !token) return '';
    const reserva = data.precontrato;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const payload: ContratoPrintPayload = {
      cotizacion: {
        codigo: data.codigo,
        fechaEvento: fechaClave(data.fechaEvento),
        turno: data.turno,
        cantidadNinos: data.cantidadNinos,
        tematica: data.tematica,
        paquete: data.paquete,
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
        items: (data.items ?? []).map((item, index) => ({
          ...item,
          id: item.id || `${item.nombre}-${index}`,
        })),
        extrasPermitidos: data.extrasPermitidos,
        extrasPermitidosComentario: data.extrasPermitidosComentario,
      },
      form: {
        numeroDocumento: '',
        tipoComprobante: 'boleta',
        documentoTributario: '',
        horarioInicio: data.horarioInicio?.trim() || 'Por confirmar',
        horarioFin: data.horarioFin?.trim() || 'Por confirmar',
        adelanto1Monto: reserva.adelanto1Monto,
        adelanto1Fecha: reserva.adelanto1Fecha,
        adelanto2Monto: reserva.adelanto2Monto ?? 0,
        adelanto2Fecha: reserva.adelanto2Fecha ?? '',
        montoGarantia: reserva.montoGarantia ?? 500,
      },
      fechaEmision: fechaClave(new Date().toISOString()),
    };
    return buildContratoPrintHtml(payload, {
      logoUrl: `${origin}/logo-bm.png`,
      esPrecontrato: true,
    });
  }, [data, token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Cargando precontrato…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-center text-error">Documento no encontrado o enlace inválido.</p>
      </div>
    );
  }

  if (!data.precontrato || !printHtml) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-center text-on-surface-variant">
          Este precontrato todavía no está disponible.
        </p>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`Precontrato ${data.codigo}`}
        description="Reserva sujeta al pago del adelanto. No confirma el evento."
        path={`/cotizacion/${token ?? ''}/precontrato`}
        robots={SEO_COTIZACION.robots}
      />
      <div className="flex min-h-screen flex-col bg-neutral-100 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-variant bg-surface-container-lowest px-4 py-3">
          <p className="text-sm font-semibold text-primary">Precontrato {data.codigo}</p>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => iframeRef.current?.contentWindow?.print()}
          >
            Imprimir / guardar PDF
          </button>
        </div>
        <iframe
          ref={iframeRef}
          title={`Precontrato ${data.codigo}`}
          srcDoc={printHtml}
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    </>
  );
}
