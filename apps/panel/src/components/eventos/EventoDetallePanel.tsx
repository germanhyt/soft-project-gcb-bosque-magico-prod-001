import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { EventoTareasSection } from '../tareas/EventoTareasSection';
import { EventoPedidosSection } from '../pedidos/EventoPedidosSection';
import { CancelarEventoModal } from './CancelarEventoModal';
import { GenerarContratoAction } from '../contratos/GenerarContratoAction';
import { EnviarContratoActions } from '../contratos/EnviarContratoActions';
import { TURNO_LABEL } from '../../constants/solicitudes';
import { ETAPA_EVENTO_LABEL } from '../../constants/eventos';
import { ETAPA_CONTRATO_LABEL } from '../../constants/contratos';
import { Button } from '../ui/Button';
import { DetalleModal } from '../ui/DetalleModal';
import { EventoBadge } from './EventoBadge';
import {
  cancelarEvento,
  confirmarEvento,
  realizarEvento,
  type Evento,
} from '../../lib/eventos';
import {
  fetchContratoEvento,
  marcarContratoEnviado,
  marcarContratoFirmado,
} from '../../lib/contratos';
import { imprimirContratoDesdeRegistro } from '../../lib/contrato-print';
import { formatFecha, formatFechaHora } from '../../lib/format';
import { fetchTareasEvento } from '../../lib/tareas-api';

type Props = {
  evento: Evento | null;
  open: boolean;
  onClose: () => void;
  loading?: boolean;
};

export function EventoDetallePanel({ evento, open, onClose, loading = false }: Props) {
  const qc = useQueryClient();
  const [cancelarOpen, setCancelarOpen] = useState(false);
  const [cancelarError, setCancelarError] = useState('');
  const eventoId = evento?.id;

  const { data: contrato, refetch: refetchContrato } = useQuery({
    queryKey: ['contrato-evento', eventoId],
    queryFn: () => fetchContratoEvento(eventoId!),
    enabled: open && !!eventoId,
  });

  const { data: tareas = [] } = useQuery({
    queryKey: ['tareas-evento', eventoId],
    queryFn: () => fetchTareasEvento(eventoId!),
    enabled: open && !!eventoId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['agenda'] });
    qc.invalidateQueries({ queryKey: ['eventos-resumen'] });
    if (eventoId) qc.invalidateQueries({ queryKey: ['pedidos-evento', eventoId] });
    if (eventoId) qc.invalidateQueries({ queryKey: ['tareas-evento', eventoId] });
  };

  const confirmarMut = useMutation({
    mutationFn: () => confirmarEvento(eventoId!),
    onSuccess: async () => {
      invalidate();
      await Swal.fire({ icon: 'success', title: 'Evento confirmado', timer: 1500, showConfirmButton: false });
      onClose();
    },
    onError: async (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : '';
      await Swal.fire({ icon: 'error', title: 'Error', text: msg || undefined });
    },
  });

  const realizarMut = useMutation({
    mutationFn: () => realizarEvento(eventoId!),
    onSuccess: async () => {
      invalidate();
      await Swal.fire({ icon: 'success', title: 'Evento realizado', timer: 1500, showConfirmButton: false });
      onClose();
    },
  });

  const cancelarMut = useMutation({
    mutationFn: (motivo: string) => cancelarEvento(eventoId!, motivo),
    onSuccess: async () => {
      setCancelarOpen(false);
      setCancelarError('');
      invalidate();
      onClose();
      await Swal.fire({ icon: 'info', title: 'Evento cancelado' });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? '')
          : 'No se pudo cancelar';
      setCancelarError(msg);
    },
  });

  const enviarContratoMut = useMutation({
    mutationFn: () => marcarContratoEnviado(contrato!.id),
    onSuccess: async () => {
      await refetchContrato();
      await Swal.fire({ icon: 'success', title: 'Contrato marcado como enviado', timer: 1500, showConfirmButton: false });
    },
  });

  const firmarContratoMut = useMutation({
    mutationFn: () => marcarContratoFirmado(contrato!.id),
    onSuccess: async () => {
      await refetchContrato();
      await Swal.fire({ icon: 'success', title: 'Contrato marcado como firmado', timer: 1500, showConfirmButton: false });
    },
  });

  const ev = evento;
  const tieneFirmaCliente = !!contrato?.adjuntos?.some((a) => a.tipo === 'firma_cliente');
  const tieneFirmaEmpresa = !!contrato?.adjuntos?.some((a) => a.tipo === 'firma_empresa');
  const firmasCompletasContrato = tieneFirmaCliente && tieneFirmaEmpresa;

  const footer =
    ev && ev.etapa !== 'cancelado' ? (
      <div className="flex flex-col gap-2">
        <GenerarContratoAction
          eventoId={ev.id}
          cotizacionId={ev.cotizacionId}
          evento={ev}
          fullWidth
          label={contrato ? 'Ver / editar contrato' : 'Generar contrato'}
          onGenerado={() => void refetchContrato()}
        />
        {contrato && (
          <>
            <p className="text-center text-xs text-outline">
              {contrato.numero} · {ETAPA_CONTRATO_LABEL[contrato.etapa] ?? contrato.etapa}
            </p>
            <EnviarContratoActions
              contrato={contrato}
              celular={contrato.snapshotJson?.cliente.celular ?? ev.cliente.celular}
              onSuccess={() => void refetchContrato()}
            />
            {contrato.etapa === 'borrador' && (
              <Button
                className="w-full"
                disabled={enviarContratoMut.isPending}
                onClick={() => enviarContratoMut.mutate()}
              >
                Marcar enviado
              </Button>
            )}
            {(contrato.etapa === 'borrador' || contrato.etapa === 'enviado') && (
              <>
                <Button
                  variant="accent"
                  className="w-full"
                  disabled={firmarContratoMut.isPending || !firmasCompletasContrato}
                  onClick={() => firmarContratoMut.mutate()}
                >
                  Marcar firmado
                </Button>
                {!firmasCompletasContrato && (
                  <p className="text-center text-xs text-tertiary">
                    Falta subir firma del cliente y firma de Bosque Mágico.
                  </p>
                )}
              </>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                void imprimirContratoDesdeRegistro(contrato, ev).then((ok) => {
                  if (!ok) {
                    void Swal.fire({ icon: 'error', title: 'No se pudo abrir la impresión' });
                  }
                });
              }}
            >
              Imprimir contrato
            </Button>
          </>
        )}
        {ev.etapa !== 'realizado' && ev.etapa === 'por_confirmar' && (
          <>
            {(!contrato || (contrato.etapa !== 'enviado' && contrato.etapa !== 'firmado')) && (
              <p className="text-center text-xs text-tertiary">
                Genera y envía el contrato antes de confirmar en la agenda.
              </p>
            )}
            <Button className="w-full" disabled={confirmarMut.isPending} onClick={() => confirmarMut.mutate()}>
              Confirmar evento (programar en agenda)
            </Button>
          </>
        )}
        {ev.etapa !== 'realizado' && ev.etapa === 'confirmado' && (
          <Button
            className="w-full bg-primary-container"
            disabled={realizarMut.isPending}
            onClick={async () => {
              const pendientes = tareas.filter((t) => t.etapa !== 'completado');
              if (pendientes.length > 0) {
                const confirm = await Swal.fire({
                  icon: 'warning',
                  title: 'Checklist incompleto',
                  text: `Quedan ${pendientes.length} tarea(s) pendientes. ¿Marcar el evento como realizado igual?`,
                  showCancelButton: true,
                  confirmButtonText: 'Marcar realizado',
                  cancelButtonText: 'Revisar checklist',
                });
                if (!confirm.isConfirmed) return;
              }
              realizarMut.mutate();
            }}
          >
            Marcar realizado
          </Button>
        )}
        {(ev.etapa === 'por_confirmar' || ev.etapa === 'confirmado') && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setCancelarError('');
              setCancelarOpen(true);
            }}
          >
            Cancelar
          </Button>
        )}
      </div>
    ) : undefined;

  return (
    <>
      <DetalleModal
        open={open}
        onClose={onClose}
        loading={loading}
        title={ev?.cliente.nombreCompleto ?? 'Evento'}
        description={
          ev
            ? `${formatFecha(ev.fechaEvento)} · ${TURNO_LABEL[ev.turno] ?? ev.turno}`
            : undefined
        }
        footer={ev ? footer : undefined}
      >
        {open && ev ? (
          <div className="space-y-4">
            <EventoBadge etapa={ev.etapa} />
            <p className="text-on-surface-variant">Cumpleañero: {ev.cumpleanero.nombre}</p>
            {ev.cotizacion && (
              <p className="font-mono text-xs text-outline">{ev.cotizacion.codigo}</p>
            )}
            <dl className="space-y-2">
              <div>
                <dt className="text-label-caps text-outline">Niños / Total</dt>
                <dd>
                  {ev.cantidadNinos} · S/ {ev.montoTotal.toFixed(2)}
                </dd>
              </div>
              {ev.confirmadoEn && (
                <div>
                  <dt className="text-label-caps text-outline">Confirmado</dt>
                  <dd>{formatFechaHora(ev.confirmadoEn)}</dd>
                </div>
              )}
            </dl>
            {ev.notas && (
              <p className="rounded-lg bg-surface-container-low p-3 whitespace-pre-wrap">{ev.notas}</p>
            )}
            <EventoPedidosSection
              eventoId={ev.id}
              fechaEvento={ev.fechaEvento}
              etapaEvento={ev.etapa}
              clienteNombre={ev.cliente.nombreCompleto}
              turnoLabel={TURNO_LABEL[ev.turno] ?? ev.turno}
              cumpleaneroEdad={ev.cumpleanero.edad}
              cantidadNinos={ev.cantidadNinos}
              tematica={ev.tematica}
            />
            <EventoTareasSection eventoId={ev.id} etapaEvento={ev.etapa} />
            <p className="text-center text-body-sm text-outline">{ETAPA_EVENTO_LABEL[ev.etapa]}</p>
          </div>
        ) : open && !loading ? (
          <p className="py-8 text-center text-on-surface-variant">No se encontró el evento.</p>
        ) : null}
      </DetalleModal>

      <CancelarEventoModal
        open={cancelarOpen}
        onClose={() => setCancelarOpen(false)}
        pending={cancelarMut.isPending}
        error={cancelarError}
        onConfirm={(motivo) => cancelarMut.mutate(motivo)}
      />
    </>
  );
}
