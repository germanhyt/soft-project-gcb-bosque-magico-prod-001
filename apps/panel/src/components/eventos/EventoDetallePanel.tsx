import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Swal from 'sweetalert2';
import { EventoTareasSection } from '../tareas/EventoTareasSection';
import { EventoPedidosSection } from '../pedidos/EventoPedidosSection';
import { CancelarEventoModal } from './CancelarEventoModal';
import { GenerarContratoAction } from '../contratos/GenerarContratoAction';
import { EnviarContratoActions } from '../contratos/EnviarContratoActions';
import { ContratoAdjuntosSection } from '../contratos/ContratoAdjuntosSection';
import { TURNO_LABEL } from '../../constants/solicitudes';
import { ETAPA_EVENTO_LABEL } from '../../constants/eventos';
import { ETAPA_CONTRATO_LABEL } from '../../constants/contratos';
import { Button } from '../ui/Button';
import { DetalleModal } from '../ui/DetalleModal';
import { DetalleActionGroup, DetalleActionHint, DetalleActionsFooter } from '../ui/DetalleActionGroup';
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
  volverContratoABorrador,
} from '../../lib/contratos';
import { imprimirContratoDesdeRegistro } from '../../lib/contrato-print';
import { formatFecha, formatFechaHora } from '../../lib/format';
import { fetchTareasEvento } from '../../lib/tareas-api';
import { mostrarErrorApi, mostrarValidacion } from '../../lib/swal-feedback';
import { puedeVolverABorradorContrato } from '../../lib/flujo-estados';

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
      await mostrarErrorApi(err, 'No se pudo confirmar el evento');
    },
  });

  const realizarMut = useMutation({
    mutationFn: () => realizarEvento(eventoId!),
    onSuccess: async () => {
      invalidate();
      await Swal.fire({ icon: 'success', title: 'Evento realizado', timer: 1500, showConfirmButton: false });
      onClose();
    },
    onError: async (err: unknown) => {
      await mostrarErrorApi(err, 'No se pudo marcar el evento como realizado');
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
    onError: async (err: unknown) => {
      await mostrarErrorApi(err, 'No se pudo marcar el contrato como enviado');
    },
  });

  const firmarContratoMut = useMutation({
    mutationFn: () => marcarContratoFirmado(contrato!.id),
    onSuccess: async () => {
      await refetchContrato();
      await Swal.fire({ icon: 'success', title: 'Contrato marcado como firmado', timer: 1500, showConfirmButton: false });
    },
    onError: async (err: unknown) => {
      await mostrarErrorApi(err, 'No se pudo marcar el contrato como firmado');
    },
  });

  const volverContratoMut = useMutation({
    mutationFn: () => volverContratoABorrador(contrato!.id),
    onSuccess: async () => {
      await Promise.all([
        refetchContrato(),
        qc.invalidateQueries({ queryKey: ['contratos'] }),
        qc.invalidateQueries({ queryKey: ['contrato', contrato?.id] }),
        qc.invalidateQueries({ queryKey: ['agenda'] }),
      ]);
      await Swal.fire({
        icon: 'success',
        title: 'Volvió a borrador',
        text: 'El cliente ve una vista previa. Edita y vuelve a enviar. Si cambias montos u horario, recaba de nuevo las firmas.',
      });
    },
    onError: async (err: unknown) => {
      await mostrarErrorApi(err, 'No se pudo volver a borrador');
    },
  });

  const ev = evento;
  const tieneFirmaCliente = !!contrato?.adjuntos?.some((a) => a.tipo === 'firma_cliente');
  const tieneFirmaEmpresa = !!contrato?.adjuntos?.some((a) => a.tipo === 'firma_empresa');
  const firmasCompletasContrato = tieneFirmaCliente && tieneFirmaEmpresa;

  const footer =
    ev && ev.etapa !== 'cancelado' ? (
      <DetalleActionsFooter>
        <DetalleActionGroup label="Contrato">
          <GenerarContratoAction
            eventoId={ev.id}
            cotizacionId={ev.cotizacionId}
            evento={ev}
            fullWidth
            nested
            redirectToContratos={false}
            className={contrato ? '' : 'col-span-2'}
            label={contrato ? 'Ver / editar contrato' : 'Generar contrato'}
            onGenerado={() => void refetchContrato()}
          />
          {contrato ? (
            <Button
              variant="ghost"
              onClick={() => {
                void imprimirContratoDesdeRegistro(contrato, ev).then((ok) => {
                  if (!ok) {
                    void Swal.fire({ icon: 'error', title: 'No se pudo abrir la impresión' });
                  }
                });
              }}
            >
              Imprimir
            </Button>
          ) : null}
          {contrato ? (
            <>
              <DetalleActionHint>
                {contrato.numero} · {ETAPA_CONTRATO_LABEL[contrato.etapa] ?? contrato.etapa}
              </DetalleActionHint>
              <EnviarContratoActions
                contrato={contrato}
                celular={contrato.snapshotJson?.cliente.celular ?? ev.cliente.celular}
                correo={contrato.snapshotJson?.cliente.correo ?? ev.cliente.correo ?? undefined}
                onSuccess={() => void refetchContrato()}
              />
              {contrato.etapa === 'borrador' ? (
                <Button
                  disabled={enviarContratoMut.isPending}
                  onClick={() => enviarContratoMut.mutate()}
                >
                  Marcar enviado
                </Button>
              ) : null}
              {puedeVolverABorradorContrato(contrato.etapa, ev.etapa) ? (
                <Button
                  variant="ghost"
                  className="col-span-2"
                  disabled={volverContratoMut.isPending}
                  onClick={() => {
                    void (async () => {
                      const ok = await Swal.fire({
                        icon: 'question',
                        title: '¿Volver a borrador?',
                        html: '<p class="text-sm">El enlace del cliente pasará a vista previa (no válido para firmar). El evento no se podrá confirmar hasta reenviar. Las firmas se conservan: si cambias montos u horario, vuelve a recabarlas.</p>',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, volver a borrador',
                        cancelButtonText: 'Cancelar',
                      });
                      if (ok.isConfirmed) volverContratoMut.mutate();
                    })();
                  }}
                >
                  {volverContratoMut.isPending ? 'Cambiando…' : 'Volver a borrador'}
                </Button>
              ) : null}
              {contrato.etapa === 'borrador' || contrato.etapa === 'enviado' ? (
                <Button
                  variant="accent"
                  disabled={firmarContratoMut.isPending}
                  className={contrato.etapa === 'enviado' ? 'col-span-2' : ''}
                  onClick={() => {
                    void (async () => {
                      if (!firmasCompletasContrato) {
                        await mostrarValidacion(
                          'Faltan firmas',
                          'Debes cargar la firma del cliente y la firma de Bosque Mágico antes de marcar el contrato como firmado.',
                        );
                        return;
                      }
                      firmarContratoMut.mutate();
                    })();
                  }}
                >
                  Marcar firmado
                </Button>
              ) : null}
            </>
          ) : null}
        </DetalleActionGroup>

        {ev.etapa === 'por_confirmar' || ev.etapa === 'confirmado' ? (
          <DetalleActionGroup label="Evento">
            {ev.etapa === 'por_confirmar' ? (
              <Button
                className="col-span-2"
                disabled={confirmarMut.isPending}
                onClick={() => {
                  void (async () => {
                    if (!contrato) {
                      await mostrarValidacion(
                        'No se puede confirmar',
                        'Debes generar el contrato antes de confirmar el evento en la agenda.',
                      );
                      return;
                    }
                    if (contrato.etapa !== 'enviado' && contrato.etapa !== 'firmado') {
                      await mostrarValidacion(
                        'No se puede confirmar',
                        'El contrato debe estar enviado o firmado antes de programar el evento.',
                      );
                      return;
                    }
                    if (!firmasCompletasContrato) {
                      await mostrarValidacion(
                        'Faltan firmas',
                        'Debes cargar la firma del cliente y la firma de Bosque Mágico antes de confirmar el evento.',
                      );
                      return;
                    }
                    confirmarMut.mutate();
                  })();
                }}
              >
                {confirmarMut.isPending ? 'Confirmando…' : 'Confirmar evento'}
              </Button>
            ) : (
              <Button
                className="col-span-2 bg-primary-container"
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
            <Button
              variant="ghost"
              className="col-span-2"
              onClick={() => {
                setCancelarError('');
                setCancelarOpen(true);
              }}
            >
              Cancelar evento
            </Button>
          </DetalleActionGroup>
        ) : null}
      </DetalleActionsFooter>
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
            {contrato ? <ContratoAdjuntosSection contrato={contrato} /> : null}
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
