import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Seo } from '../components/Seo';
import { BTN_PRIMARY, CARD_CLASS, SWAL_CONFIRM_COLOR } from '../constants/design';
import { api } from '../lib/api';

type PedidoPublico = {
  servicio: string;
  cantidad: number;
  costo: number;
  etapa: string;
  notas: string | null;
  proveedor: string;
  evento: {
    fechaEvento: string;
    turno: string;
    clienteNombre: string;
  };
  puedeConfirmar: boolean;
  puedeRechazar: boolean;
};

async function fetchPublica(token: string) {
  const { data } = await api.get<PedidoPublico>(`/public/bosque-magico/pedidos/${token}`);
  return data;
}

async function confirmarPublica(token: string) {
  const { data } = await api.post(`/public/bosque-magico/pedidos/${token}/confirmar`);
  return data;
}

async function rechazarPublica(token: string, motivo?: string) {
  const { data } = await api.post(`/public/bosque-magico/pedidos/${token}/rechazar`, {
    motivo,
  });
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

const ETAPA_LABEL: Record<string, string> = {
  pendiente: 'Pendiente de respuesta',
  solicitado: 'Solicitado',
  confirmado: 'Confirmado',
  entregado: 'Completado',
  cancelado: 'Rechazado / cancelado',
};

export function PedidoProveedorPublicaPage() {
  const { token } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pedido-proveedor-publico', token],
    queryFn: () => fetchPublica(token!),
    enabled: !!token,
  });

  const confirmar = useMutation({
    mutationFn: () => confirmarPublica(token!),
    onSuccess: async (res: { mensaje?: string }) => {
      await qc.invalidateQueries({ queryKey: ['pedido-proveedor-publico', token] });
      await Swal.fire({
        icon: 'success',
        title: 'Confirmado',
        text: res.mensaje ?? 'Gracias por confirmar tu disponibilidad.',
        confirmButtonColor: SWAL_CONFIRM_COLOR,
      });
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : '';
      await Swal.fire({ icon: 'error', title: 'No se pudo confirmar', text: msg || undefined });
    },
  });

  const rechazar = useMutation({
    mutationFn: () => rechazarPublica(token!, motivoRechazo.trim() || undefined),
    onSuccess: async (res: { mensaje?: string }) => {
      await qc.invalidateQueries({ queryKey: ['pedido-proveedor-publico', token] });
      await Swal.fire({
        icon: 'info',
        title: 'Rechazo registrado',
        text: res.mensaje ?? 'Hemos informado al equipo de Bosque Mágico.',
        confirmButtonColor: SWAL_CONFIRM_COLOR,
      });
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : '';
      await Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: msg || undefined });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Cargando solicitud…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className={`${CARD_CLASS} max-w-lg p-8 text-center`}>
          <h1 className="text-title-md text-primary">Solicitud no disponible</h1>
          <p className="mt-2 text-on-surface-variant">
            El enlace no es válido o el pedido ya no está disponible.
          </p>
        </div>
      </div>
    );
  }

  const respondido = !data.puedeConfirmar && !data.puedeRechazar;

  return (
    <>
      <Seo
        title={`Pedido — ${data.servicio}`}
        description="Confirmación de pedido Bosque Mágico"
        path={`/pedido-proveedor/${token ?? ''}`}
      />
      <div className="min-h-screen bg-background px-4 py-8">
        <div className={`mx-auto max-w-lg ${CARD_CLASS} p-8`}>
          <p className="text-label-caps text-outline">Bosque Mágico</p>
          <h1 className="text-title-lg text-primary">Solicitud de servicio</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Hola {data.proveedor}, revisa los datos del evento y confirma tu disponibilidad.
          </p>

          <dl className="mt-6 space-y-3 text-body-sm">
            <div>
              <dt className="text-outline">Servicio</dt>
              <dd className="font-medium text-on-surface">
                {data.servicio} × {data.cantidad}
              </dd>
            </div>
            <div>
              <dt className="text-outline">Cliente / evento</dt>
              <dd>
                {data.evento.clienteNombre}
                <br />
                {formatFecha(data.evento.fechaEvento)} · {data.evento.turno}
              </dd>
            </div>
            <div>
              <dt className="text-outline">Costo referencial</dt>
              <dd>{formatSoles(data.costo)}</dd>
            </div>
            {data.notas && (
              <div>
                <dt className="text-outline">Notas</dt>
                <dd className="whitespace-pre-wrap">{data.notas}</dd>
              </div>
            )}
            <div>
              <dt className="text-outline">Estado</dt>
              <dd>{ETAPA_LABEL[data.etapa] ?? data.etapa}</dd>
            </div>
          </dl>

          {data.puedeConfirmar && (
            <div className="mt-8 space-y-4">
              <button
                type="button"
                className={`${BTN_PRIMARY} w-full disabled:opacity-60`}
                disabled={confirmar.isPending || rechazar.isPending}
                onClick={() => confirmar.mutate()}
              >
                Confirmar disponibilidad
              </button>

              <div className="rounded-xl border border-surface-variant bg-surface-container-low/50 p-4">
                <p className="text-body-sm font-medium text-on-surface">No puedo atender este evento</p>
                <textarea
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-surface-variant bg-surface px-3 py-2 text-body-sm"
                  placeholder="Motivo opcional (horario, otro compromiso…)"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                />
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-error/40 px-4 py-2 text-body-sm font-medium text-error hover:bg-error-container/20 disabled:opacity-60"
                  disabled={confirmar.isPending || rechazar.isPending}
                  onClick={() => rechazar.mutate()}
                >
                  Rechazar solicitud
                </button>
              </div>
            </div>
          )}

          {respondido && (
            <p className="mt-8 rounded-xl bg-surface-container-low p-4 text-center text-body-sm text-on-surface-variant">
              {data.etapa === 'confirmado'
                ? 'Ya confirmaste este pedido. Gracias.'
                : data.etapa === 'cancelado'
                  ? 'Este pedido fue rechazado.'
                  : 'Este pedido ya fue gestionado por el equipo.'}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
