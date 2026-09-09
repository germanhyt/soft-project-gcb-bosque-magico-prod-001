import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { formatFechaCalendarioLarga } from '@bosque/shared';
import { Seo } from '../components/Seo';
import { BTN_PRIMARY, CARD_CLASS, INPUT_CLASS, SWAL_CONFIRM_COLOR } from '../constants/design';
import { api } from '../lib/api';

type PedidoPublico = {
  servicio: string;
  cantidad: number;
  costo: number;
  costoEstimadoProveedor: number | null;
  comentarioProveedor: string | null;
  etapa: string;
  notas: string | null;
  proveedor: string;
  evento: {
    fechaEvento: string;
    turno: string;
    clienteNombre: string;
    cumpleaneroEdad: number | null;
    cantidadNinos: number;
    tematica: string | null;
  };
  puedeProponerCosto: boolean;
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

async function proponerCostoPublica(
  token: string,
  payload: { costoEstimado: number; comentario?: string },
) {
  const { data } = await api.post(
    `/public/bosque-magico/pedidos/${token}/propuesta-costo`,
    payload,
  );
  return data;
}

function formatFecha(iso: string) {
  return formatFechaCalendarioLarga(iso);
}

function formatSoles(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

function apiMessage(err: unknown) {
  if (err && typeof err === 'object' && 'response' in err) {
    return String(
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '',
    );
  }
  return '';
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
  const [costoEstimado, setCostoEstimado] = useState('');
  const [comentario, setComentario] = useState('');
  const [paso, setPaso] = useState<'costo' | 'disponibilidad'>('costo');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pedido-proveedor-publico', token],
    queryFn: () => fetchPublica(token!),
    enabled: !!token,
  });

  useEffect(() => {
    if (!data) return;
    setCostoEstimado(
      data.costoEstimadoProveedor != null ? String(data.costoEstimadoProveedor) : '',
    );
    setComentario(data.comentarioProveedor ?? '');
    setPaso(data.costoEstimadoProveedor != null ? 'disponibilidad' : 'costo');
  }, [data]);

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
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo confirmar',
        text: apiMessage(err) || undefined,
      });
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
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo registrar',
        text: apiMessage(err) || undefined,
      });
    },
  });

  const proponer = useMutation({
    mutationFn: () => {
      const costo = Number(costoEstimado);
      if (!Number.isFinite(costo) || costo < 0) {
        return Promise.reject(new Error('Costo inválido'));
      }
      return proponerCostoPublica(token!, {
        costoEstimado: costo,
        comentario: comentario.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['pedido-proveedor-publico', token] });
      setPaso('disponibilidad');
      await Swal.fire({
        icon: 'success',
        title: 'Costo enviado',
        text: 'Ahora indica si puedes atender el evento.',
        confirmButtonColor: SWAL_CONFIRM_COLOR,
      });
    },
    onError: async (err: unknown) => {
      const msg = err instanceof Error && !('response' in err) ? err.message : apiMessage(err);
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar el costo',
        text: msg || undefined,
      });
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
  const ocupado = confirmar.isPending || rechazar.isPending || proponer.isPending;

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
          <h1 className="text-title-lg text-primary">Consulta de servicio</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Hola {data.proveedor}, revisa los datos del evento. Primero envía tu costo; después
            confirma o rechaza la fecha.
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
              <dt className="text-outline">Datos del evento</dt>
              <dd>
                Cumpleañero: {data.evento.cumpleaneroEdad ?? 'No especificada'} años
                <br />
                Niños: {data.evento.cantidadNinos}
                <br />
                Temática: {data.evento.tematica || 'No especificada'}
              </dd>
            </div>
            {data.costo > 0 && (
              <div>
                <dt className="text-outline">Costo referencial (interno)</dt>
                <dd>{formatSoles(data.costo)}</dd>
              </div>
            )}
            {data.costoEstimadoProveedor != null && (
              <div>
                <dt className="text-outline">Tu costo estimado</dt>
                <dd>
                  {formatSoles(data.costoEstimadoProveedor)}
                  {data.comentarioProveedor ? (
                    <span className="mt-1 block whitespace-pre-wrap text-on-surface-variant">
                      {data.comentarioProveedor}
                    </span>
                  ) : null}
                </dd>
              </div>
            )}
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

          {data.puedeProponerCosto && paso === 'costo' && (
            <form
              className="mt-8 space-y-3 rounded-xl border border-surface-variant bg-surface-container-low/50 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                proponer.mutate();
              }}
            >
              <p className="text-label-caps text-outline">Paso 1 de 2</p>
              <p className="text-body-sm font-medium text-on-surface">Tu costo estimado</p>
              <p className="text-xs text-on-surface-variant">
                Solo informa el precio. Esto no confirma que atiendes el evento.
              </p>
              <label className="block text-body-sm">
                Monto (S/)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  className={`mt-1 ${INPUT_CLASS}`}
                  value={costoEstimado}
                  onChange={(e) => setCostoEstimado(e.target.value)}
                />
              </label>
              <label className="block text-body-sm">
                Comentario (opcional)
                <textarea
                  rows={3}
                  className={`mt-1 ${INPUT_CLASS}`}
                  placeholder="Traslado, horarios, condiciones…"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
              </label>
              <button type="submit" className={`${BTN_PRIMARY} w-full disabled:opacity-60`} disabled={ocupado}>
                Enviar costo y continuar
              </button>
              {data.puedeRechazar && (
                <button
                  type="button"
                  className="w-full text-body-sm text-outline underline-offset-2 hover:underline"
                  onClick={() => setPaso('disponibilidad')}
                >
                  No puedo atender — ir a rechazar
                </button>
              )}
            </form>
          )}

          {data.puedeConfirmar && paso === 'disponibilidad' && (
            <div className="mt-8 space-y-4">
              <div>
                <p className="text-label-caps text-outline">Paso 2 de 2</p>
                <p className="text-body-sm font-medium text-on-surface">¿Puedes atender esta fecha?</p>
                <p className="text-xs text-on-surface-variant">
                  Confirmar o rechazar es independiente del costo que enviaste.
                </p>
              </div>
              {data.puedeProponerCosto && (
                <button
                  type="button"
                  className="text-body-sm text-primary underline-offset-2 hover:underline"
                  onClick={() => setPaso('costo')}
                >
                  Volver a editar el costo
                </button>
              )}
              <button
                type="button"
                className={`${BTN_PRIMARY} w-full disabled:opacity-60`}
                disabled={ocupado}
                onClick={() => confirmar.mutate()}
              >
                Confirmar disponibilidad
              </button>

              <div className="rounded-xl border border-surface-variant bg-surface-container-low/50 p-4">
                <p className="text-body-sm font-medium text-on-surface">No puedo atender este evento</p>
                <textarea
                  rows={3}
                  className={`mt-2 ${INPUT_CLASS}`}
                  placeholder="Motivo opcional (horario, otro compromiso…)"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                />
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-error/40 px-4 py-2 text-body-sm font-medium text-error hover:bg-error-container/20 disabled:opacity-60"
                  disabled={ocupado}
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
