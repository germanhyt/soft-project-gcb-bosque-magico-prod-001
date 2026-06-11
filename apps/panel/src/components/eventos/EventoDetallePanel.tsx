import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
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
import { contratoToPrintPayload } from '../../lib/contrato';
import { imprimirContratoPdf } from '../../lib/contrato-print';
import { formatFecha, formatFechaHora } from '../../lib/format';

type Props = {
  evento: Evento | null;
  open: boolean;
  onClose: () => void;
};

export function EventoDetallePanel({ evento, open, onClose }: Props) {
  const qc = useQueryClient();
  const [cancelarOpen, setCancelarOpen] = useState(false);
  const [cancelarError, setCancelarError] = useState('');
  const eventoId = evento?.id;

  const { data: contrato, refetch: refetchContrato } = useQuery({
    queryKey: ['contrato-evento', eventoId],
    queryFn: () => fetchContratoEvento(eventoId!),
    enabled: open && !!eventoId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['agenda'] });
    qc.invalidateQueries({ queryKey: ['eventos-resumen'] });
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

  const footer =
    ev && ev.etapa !== 'cancelado' ? (
      <div className="flex flex-col gap-2">
        <GenerarContratoAction
          eventoId={ev.id}
          cotizacionId={ev.cotizacionId}
          evento={ev}
          fullWidth
          label={contrato ? 'Ver / reimprimir contrato' : 'Generar contrato'}
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
              <Button
                variant="accent"
                className="w-full"
                disabled={firmarContratoMut.isPending}
                onClick={() => firmarContratoMut.mutate()}
              >
                Marcar firmado
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                const ok = imprimirContratoPdf(contratoToPrintPayload(contrato, ev));
                if (!ok) {
                  void Swal.fire({ icon: 'error', title: 'No se pudo abrir la impresión' });
                }
              }}
            >
              Imprimir contrato
            </Button>
          </>
        )}
        {ev.etapa !== 'realizado' && ev.etapa === 'por_confirmar' && (
          <Button className="w-full" disabled={confirmarMut.isPending} onClick={() => confirmarMut.mutate()}>
            Confirmar evento
          </Button>
        )}
        {ev.etapa !== 'realizado' && ev.etapa === 'confirmado' && (
          <Button
            className="w-full bg-primary-container"
            disabled={realizarMut.isPending}
            onClick={() => realizarMut.mutate()}
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
        open={open && !!ev}
        onClose={onClose}
        title={ev?.cliente.nombreCompleto ?? 'Evento'}
        description={
          ev
            ? `${formatFecha(ev.fechaEvento)} · ${TURNO_LABEL[ev.turno] ?? ev.turno}`
            : undefined
        }
        footer={footer}
      >
        {ev && (
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
            <p className="text-center text-body-sm text-outline">{ETAPA_EVENTO_LABEL[ev.etapa]}</p>
          </div>
        )}
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
