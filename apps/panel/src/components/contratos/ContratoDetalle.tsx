import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { AuditoriaTimeline } from '../auditoria/AuditoriaTimeline';
import { ContratoBadge } from './ContratoBadge';
import { ContratoFormModal } from './ContratoFormModal';
import { EnviarContratoActions } from './EnviarContratoActions';
import { DetalleModal } from '../ui/DetalleModal';
import { Button } from '../ui/Button';
import { CARD_CLASS } from '../../constants/design';
import { TURNO_LABEL } from '../../constants/solicitudes';
import { contratoToPrintPayload } from '../../lib/contrato';
import { imprimirContratoPdf } from '../../lib/contrato-print';
import {
  fetchContrato,
  marcarContratoFirmado,
  type Contrato,
} from '../../lib/contratos';
import { formatFecha, formatFechaHora } from '../../lib/format';
import { useState } from 'react';

type Props = {
  contratoId: string | null;
  listItem?: Contrato;
  open: boolean;
  onClose: () => void;
};

export function ContratoDetalle({ contratoId, listItem, open, onClose }: Props) {
  const qc = useQueryClient();
  const [editarOpen, setEditarOpen] = useState(false);

  const { data: contrato, isLoading, isError } = useQuery({
    queryKey: ['contrato', contratoId],
    queryFn: () => fetchContrato(contratoId!),
    enabled: open && !!contratoId,
    initialData: listItem,
  });

  const firmarMut = useMutation({
    mutationFn: () => marcarContratoFirmado(contrato!.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['contrato', contratoId] });
      await qc.invalidateQueries({ queryKey: ['contratos'] });
      await Swal.fire({
        icon: 'success',
        title: 'Contrato firmado',
        timer: 1500,
        showConfirmButton: false,
      });
    },
  });

  if (!open || !contratoId) return null;

  const c = contrato;
  const snap = c?.snapshotJson;
  const celular = snap?.cliente.celular ?? c?.evento?.cliente.celular ?? '';

  const footer =
    c && !isLoading ? (
      <div className="flex flex-col gap-2">
        {celular && <EnviarContratoActions contrato={c} celular={celular} />}
        {(c.etapa === 'borrador' || c.etapa === 'enviado') && (
          <Button
            variant="accent"
            className="w-full"
            disabled={firmarMut.isPending}
            onClick={() => firmarMut.mutate()}
          >
            Marcar firmado
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            const ok = imprimirContratoPdf(contratoToPrintPayload(c));
            if (!ok) {
              void Swal.fire({ icon: 'error', title: 'No se pudo abrir la impresión' });
            }
          }}
        >
          Imprimir / PDF
        </Button>
        {c.etapa === 'borrador' && (
          <Button variant="secondary" className="w-full" onClick={() => setEditarOpen(true)}>
            Editar datos
          </Button>
        )}
      </div>
    ) : undefined;

  return (
    <>
      <DetalleModal
        open={open}
        onClose={onClose}
        title={c?.numero ?? listItem?.numero ?? 'Contrato'}
        description={
          snap
            ? `${snap.cliente.nombreCompleto} · ${formatFecha(snap.evento.fechaEvento)}`
            : undefined
        }
        loading={isLoading && !c}
        footer={footer}
      >
        {isError && !c ? (
          <p className="text-error">Contrato no encontrado o error de API.</p>
        ) : c && snap ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <ContratoBadge etapa={c.etapa} />
              {c.cotizacion && (
                <span className="font-mono text-xs text-outline">{c.cotizacion.codigo}</span>
              )}
            </div>

            <dl className={`grid gap-3 p-4 sm:grid-cols-2 ${CARD_CLASS}`}>
              <div>
                <dt className="text-label-caps text-outline">Cliente</dt>
                <dd className="font-medium">{snap.cliente.nombreCompleto}</dd>
                <dd className="text-body-sm text-on-surface-variant">{snap.cliente.celular}</dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">DNI</dt>
                <dd className="font-medium">{c.numeroDocumento}</dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">Cumpleañero</dt>
                <dd className="font-medium">
                  {snap.cumpleanero.nombre}
                  {snap.cumpleanero.edad ? ` (${snap.cumpleanero.edad} años)` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-label-caps text-outline">Evento</dt>
                <dd className="font-medium">
                  {formatFecha(snap.evento.fechaEvento)} ·{' '}
                  {TURNO_LABEL[snap.evento.turno] ?? snap.evento.turno}
                </dd>
                <dd className="text-body-sm text-on-surface-variant">
                  {c.horarioInicio} — {c.horarioFin}
                </dd>
              </div>
            </dl>

            <dl className={`space-y-2 p-4 ${CARD_CLASS}`}>
              <div className="flex justify-between">
                <dt>Total contratado</dt>
                <dd className="font-bold text-primary">S/ {c.montoTotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-body-sm">
                <dt>Adelanto 1</dt>
                <dd>
                  S/ {c.adelanto1Monto.toFixed(2)}
                  {c.adelanto1Fecha ? ` · ${formatFecha(c.adelanto1Fecha)}` : ''}
                </dd>
              </div>
              {c.adelanto2Monto != null && c.adelanto2Monto > 0 && (
                <div className="flex justify-between text-body-sm">
                  <dt>Adelanto 2</dt>
                  <dd>
                    S/ {c.adelanto2Monto.toFixed(2)}
                    {c.adelanto2Fecha ? ` · ${formatFecha(c.adelanto2Fecha)}` : ''}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-body-sm">
                <dt>Pendiente</dt>
                <dd>S/ {c.montoPendiente.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-body-sm">
                <dt>Garantía</dt>
                <dd>S/ {c.montoGarantia.toFixed(2)}</dd>
              </div>
            </dl>

            {(c.enviadoEn || c.firmadoEn) && (
              <dl className={`grid gap-2 p-4 text-body-sm ${CARD_CLASS}`}>
                {c.enviadoEn && (
                  <div>
                    <dt className="text-label-caps text-outline">Enviado</dt>
                    <dd>{formatFechaHora(c.enviadoEn)}</dd>
                  </div>
                )}
                {c.firmadoEn && (
                  <div>
                    <dt className="text-label-caps text-outline">Firmado</dt>
                    <dd>{formatFechaHora(c.firmadoEn)}</dd>
                  </div>
                )}
              </dl>
            )}

            <div>
              <h3 className="font-bold text-primary">Bitácora</h3>
              <div className="mt-3">
                <AuditoriaTimeline tipoEntidad="contrato" entidadId={c.id} />
              </div>
            </div>
          </div>
        ) : null}
      </DetalleModal>

      {c && c.etapa === 'borrador' && (
        <ContratoFormModal
          open={editarOpen}
          onClose={() => setEditarOpen(false)}
          eventoId={c.eventoId}
          cotizacionId={c.cotizacionId}
          onGenerado={() => {
            setEditarOpen(false);
            void qc.invalidateQueries({ queryKey: ['contrato', contratoId] });
          }}
        />
      )}
    </>
  );
}
