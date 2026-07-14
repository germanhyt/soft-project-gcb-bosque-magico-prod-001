import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuditoriaTimeline } from '../auditoria/AuditoriaTimeline';
import { ContratoBadge } from './ContratoBadge';
import { ContratoFormModal } from './ContratoFormModal';
import { ContratoAdjuntosSection } from './ContratoAdjuntosSection';
import { EnviarContratoActions } from './EnviarContratoActions';
import { DetalleModal } from '../ui/DetalleModal';
import { DetalleActionGroup, DetalleActionsFooter } from '../ui/DetalleActionGroup';
import { Button } from '../ui/Button';
import { puedeEnviarContrato, puedeMarcarContratoFirmado } from '../../lib/flujo-estados';
import { CARD_CLASS } from '../../constants/design';
import { TURNO_LABEL } from '../../constants/solicitudes';
import { imprimirContratoDesdeRegistro } from '../../lib/contrato-print';
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
  const navigate = useNavigate();
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
      const eventoId = contrato!.eventoId;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['contrato', contratoId] }),
        qc.invalidateQueries({ queryKey: ['contratos'] }),
        qc.invalidateQueries({ queryKey: ['agenda'] }),
        qc.invalidateQueries({ queryKey: ['evento', eventoId] }),
        qc.invalidateQueries({ queryKey: ['contrato-evento', eventoId] }),
        qc.invalidateQueries({ queryKey: ['cotizacion', contrato!.cotizacionId] }),
      ]);

      const result = await Swal.fire({
        icon: 'success',
        title: 'Contrato firmado',
        html: eventoId
          ? '<p class="text-sm">El contrato quedó firmado. Puedes continuar en Agenda para confirmar el evento cuando operaciones estén listas.</p>'
          : '<p class="text-sm">El contrato quedó firmado.</p>',
        showCancelButton: !!eventoId,
        confirmButtonText: 'Continuar aquí',
        cancelButtonText: 'Ir a Agenda',
        reverseButtons: true,
      });

      if (eventoId && result.dismiss === Swal.DismissReason.cancel) {
        onClose();
        navigate(`/agenda?detalle=${eventoId}`);
      }
    },
  });

  if (!open || !contratoId) return null;

  const c = contrato;
  const snap = c?.snapshotJson;
  const celular = snap?.cliente.celular ?? c?.evento?.cliente.celular ?? '';
  const correo = snap?.cliente.correo ?? undefined;
  const tieneFirmaCliente = !!c?.adjuntos?.some((a) => a.tipo === 'firma_cliente');
  const tieneFirmaEmpresa = !!c?.adjuntos?.some((a) => a.tipo === 'firma_empresa');
  const firmasCompletas = tieneFirmaCliente && tieneFirmaEmpresa;

  const footer =
    c && !isLoading ? (
      <DetalleActionsFooter>
        {celular && puedeEnviarContrato(c.etapa) ? (
          <DetalleActionGroup label="Compartir con el cliente">
            <EnviarContratoActions contrato={c} celular={celular} correo={correo} />
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                void imprimirContratoDesdeRegistro(c).then((ok) => {
                  if (!ok) {
                    void Swal.fire({ icon: 'error', title: 'No se pudo abrir la impresión' });
                  }
                });
              }}
            >
              Imprimir / PDF
            </Button>
          </DetalleActionGroup>
        ) : (
          <DetalleActionGroup label="Documento">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                void imprimirContratoDesdeRegistro(c).then((ok) => {
                  if (!ok) {
                    void Swal.fire({ icon: 'error', title: 'No se pudo abrir la impresión' });
                  }
                });
              }}
            >
              Imprimir / PDF
            </Button>
          </DetalleActionGroup>
        )}

        {puedeMarcarContratoFirmado(c.etapa) ? (
          <DetalleActionGroup label="Confirmar flujo">
            <Button
              variant="accent"
              className="w-full"
              disabled={firmarMut.isPending || !firmasCompletas}
              onClick={() => firmarMut.mutate()}
            >
              Marcar firmado
            </Button>
            {!firmasCompletas && (
              <p className="mt-2 text-center text-xs text-tertiary">
                Sube firma del cliente y firma de Bosque Mágico para continuar.
              </p>
            )}
          </DetalleActionGroup>
        ) : null}

        {c.etapa === 'borrador' ? (
          <DetalleActionGroup label="Editar">
            <Button variant="secondary" className="w-full" onClick={() => setEditarOpen(true)}>
              Editar datos
            </Button>
          </DetalleActionGroup>
        ) : null}

        {c.etapa === 'firmado' && c.eventoId ? (
          <DetalleActionGroup label="Siguiente paso">
            <Button
              variant="accent"
              className="w-full"
              onClick={() => {
                onClose();
                navigate(`/agenda?detalle=${c.eventoId}`);
              }}
            >
              Ir a Agenda
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

            <ContratoAdjuntosSection contrato={c} />

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
