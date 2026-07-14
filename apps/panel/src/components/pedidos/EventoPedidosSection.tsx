import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  AREA_PEDIDO_LABEL,
  ETAPA_PEDIDO_BADGE,
  ETAPA_PEDIDO_LABEL,
  ETAPAS_PEDIDO_OPCIONES,
} from '../../constants/pedidos';
import { fetchProductosCatalogo } from '../../lib/configuracion';
import {
  actualizarPedido,
  crearPedido,
  fetchPedidosEvento,
  generarPedidosEvento,
} from '../../lib/pedidos-api';
import { fetchProveedores } from '../../lib/proveedores-api';
import type { EtapaPedido, Pedido } from '../../lib/pedidos';
import { formatFecha } from '../../lib/format';
import { buildPedidoProveedorEventoResumen } from '../../lib/pedido-proveedor-evento';
import { mostrarFeedbackNotificacionProveedor } from '../../lib/notificacion-pedido-proveedor-feedback';
import {
  agruparPedidosPorProveedor,
  type GrupoPedidosProveedor,
} from '../../lib/whatsapp-pedido-proveedor';
import { Button } from '../ui/Button';
import { EnviarPedidoProveedorCorreoModal } from './EnviarPedidoProveedorCorreoModal';
import { PedidoProveedorWhatsAppModal } from './PedidoProveedorWhatsAppModal';
import { PedidoFormModal } from './PedidoFormModal';

type Props = {
  eventoId: string;
  fechaEvento: string;
  etapaEvento: string;
  clienteNombre?: string;
  turnoLabel?: string;
  cumpleaneroEdad?: number | null;
  cantidadNinos?: number;
  tematica?: string | null;
};

export function EventoPedidosSection({
  eventoId,
  fechaEvento,
  etapaEvento,
  clienteNombre = '',
  turnoLabel = '',
  cumpleaneroEdad,
  cantidadNinos,
  tematica,
}: Props) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [contactoGrupoKey, setContactoGrupoKey] = useState<string | null>(null);
  const [contactoCanal, setContactoCanal] = useState<'whatsapp' | 'correo' | null>(null);
  const puedeOperar =
    etapaEvento === 'por_confirmar' ||
    etapaEvento === 'confirmado' ||
    etapaEvento === 'realizado';

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos-evento', eventoId],
    queryFn: () => fetchPedidosEvento(eventoId),
    enabled: !!eventoId,
  });

  const { data: productos = [] } = useQuery({
    queryKey: ['productos-catalogo', 'activos'],
    queryFn: () => fetchProductosCatalogo(false),
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores', 'activos'],
    queryFn: () => fetchProveedores(true),
  });

  const { gruposProveedor, internos } = useMemo(
    () => agruparPedidosPorProveedor(pedidos),
    [pedidos],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: ['pedidos-evento', eventoId] });

  const crearMut = useMutation({
    mutationFn: (payload: Parameters<typeof crearPedido>[1]) => crearPedido(eventoId, payload),
    onSuccess: async () => {
      await invalidate();
      await Swal.fire({ icon: 'success', title: 'Pedido creado', timer: 1200, showConfirmButton: false });
    },
  });

  const generarMut = useMutation({
    mutationFn: () => generarPedidosEvento(eventoId),
    onSuccess: async (rows) => {
      await invalidate();
      await Swal.fire({
        icon: rows.length ? 'success' : 'info',
        title: rows.length ? `${rows.length} pedido(s) generados` : 'Sin ítems de proveedor',
        timer: 1800,
        showConfirmButton: false,
      });
    },
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: EtapaPedido }) =>
      actualizarPedido(id, { etapa }),
    onSuccess: async (res, { etapa }) => {
      await invalidate();
      if (etapa === 'solicitado') {
        await mostrarFeedbackNotificacionProveedor(res.notificacionProveedor);
      }
    },
  });

  const marcarGrupoSolicitadoMut = useMutation({
    mutationFn: async (grupo: GrupoPedidosProveedor) => {
      const aSolicitar = grupo.pedidos.filter((p) => p.etapa === 'pendiente');
      const results = [];
      for (const p of aSolicitar) {
        results.push(await actualizarPedido(p.id, { etapa: 'solicitado' }));
      }
      return { results, count: aSolicitar.length };
    },
    onSuccess: async ({ results, count }) => {
      await invalidate();
      if (count === 0) {
        await Swal.fire({
          icon: 'info',
          title: 'Nada pendiente',
          text: 'No hay pedidos en pendiente para marcar como solicitados.',
          timer: 1800,
          showConfirmButton: false,
        });
        return;
      }
      const last = results[results.length - 1];
      if (last?.notificacionProveedor) {
        await mostrarFeedbackNotificacionProveedor(last.notificacionProveedor);
      } else {
        await Swal.fire({
          icon: 'success',
          title: `${count} pedido(s) → Solicitado`,
          timer: 1600,
          showConfirmButton: false,
        });
      }
    },
  });

  const totalCosto = pedidos.reduce((n, p) => n + p.costo, 0);
  const grupoContacto = contactoGrupoKey
    ? gruposProveedor.find((g) => g.key === contactoGrupoKey)
    : undefined;
  const eventoContactoResumen = grupoContacto
    ? buildPedidoProveedorEventoResumen(grupoContacto.pedidos[0], {
        eventoId,
        clienteNombre,
        fechaEvento,
        turnoLabel,
        cumpleaneroEdad,
        cantidadNinos,
        tematica,
      })
    : null;

  const abrirContactoGrupo = (key: string, canal: 'whatsapp' | 'correo') => {
    setContactoGrupoKey(key);
    setContactoCanal(canal);
  };

  const cerrarContacto = () => {
    setContactoGrupoKey(null);
    setContactoCanal(null);
  };

  const renderPedidoRow = (p: Pedido, opciones?: { ocultarContacto?: boolean }) => (
    <li
      key={p.id}
      className="rounded-lg border border-surface-variant bg-surface-container-lowest px-3 py-2"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-on-surface">{p.nombre}</p>
          <p className="text-xs text-outline">
            {AREA_PEDIDO_LABEL[p.area]} · {p.tipo === 'proveedor' ? 'Proveedor' : 'Interno'}
            {p.proveedor ? ` · ${p.proveedor.nombre}` : ''}
            {p.fechaRequerida ? ` · ${formatFecha(p.fechaRequerida)}` : ''}
          </p>
          <p className="text-xs text-on-surface-variant">
            Cant. {p.cantidad} · S/ {p.costo.toFixed(2)}
          </p>
        </div>
        <select
          className="rounded-lg border border-surface-variant bg-surface-container-low px-2 py-1 text-xs"
          value={p.etapa}
          disabled={!puedeOperar || actualizarMut.isPending}
          onChange={(e) =>
            actualizarMut.mutate({ id: p.id, etapa: e.target.value as EtapaPedido })
          }
        >
          {ETAPAS_PEDIDO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <span
        className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${ETAPA_PEDIDO_BADGE[p.etapa]}`}
      >
        {ETAPA_PEDIDO_LABEL[p.etapa]}
      </span>
      {!opciones?.ocultarContacto &&
        puedeOperar &&
        p.tipo === 'proveedor' &&
        (p.proveedor?.celular || p.proveedor?.correo) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {p.proveedor?.celular && (
              <Button
                variant="ghost"
                className="!px-2 !py-1 text-xs"
                onClick={() =>
                  abrirContactoGrupo(
                    p.proveedorId ?? `nombre:${p.proveedor?.nombre ?? p.id}`,
                    'whatsapp',
                  )
                }
              >
                WhatsApp proveedor
              </Button>
            )}
            {p.proveedor?.correo && (
              <Button
                variant="ghost"
                className="!px-2 !py-1 text-xs"
                onClick={() =>
                  abrirContactoGrupo(
                    p.proveedorId ?? `nombre:${p.proveedor?.nombre ?? p.id}`,
                    'correo',
                  )
                }
              >
                Correo proveedor
              </Button>
            )}
          </div>
        )}
    </li>
  );

  return (
    <section className="rounded-xl border border-surface-variant bg-surface-container-low/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-body-sm font-bold uppercase tracking-wide text-primary">
            Pedidos operativos
          </h4>
          {pedidos.length > 0 && (
            <p className="text-xs text-outline">
              {pedidos.length} pedido(s) · S/ {totalCosto.toFixed(2)} costo estimado
            </p>
          )}
        </div>
        {puedeOperar && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="!px-3 !py-1.5 text-xs"
              disabled={generarMut.isPending}
              onClick={() => generarMut.mutate()}
            >
              Generar desde cotización
            </Button>
            <Button className="!px-3 !py-1.5 text-xs" onClick={() => setModalOpen(true)}>
              + Pedido
            </Button>
          </div>
        )}
      </div>

      {etapaEvento === 'por_confirmar' && (
        <p className="text-body-sm text-on-surface-variant pb-2">
          Gestiona pedidos a proveedor y confírmalos antes de programar el evento en la agenda.
          La comunicación se agrupa por proveedor (un mensaje con todos sus servicios).
        </p>
      )}

      {isLoading && <p className="text-body-sm text-outline">Cargando pedidos…</p>}

      {!isLoading && pedidos.length === 0 && etapaEvento !== 'por_confirmar' && (
        <p className="text-body-sm text-on-surface-variant">Sin pedidos registrados.</p>
      )}

      {gruposProveedor.length > 0 && (
        <div className="space-y-4">
          {gruposProveedor.map((grupo) => {
            const pendientes = grupo.pedidos.filter((p) => p.etapa === 'pendiente').length;
            return (
              <div
                key={grupo.key}
                className="rounded-xl border border-primary/15 bg-primary-fixed/10 p-3"
              >
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary">{grupo.proveedorNombre}</p>
                    <p className="text-xs text-on-surface-variant">
                      {grupo.pedidos.length} servicio(s)
                      {pendientes > 0 ? ` · ${pendientes} pendiente(s)` : ''}
                    </p>
                  </div>
                  {puedeOperar && (grupo.celular || grupo.correo) && (
                    <div className="flex flex-wrap gap-2">
                      {grupo.celular && (
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => abrirContactoGrupo(grupo.key, 'whatsapp')}
                        >
                          WhatsApp ({grupo.pedidos.length})
                        </Button>
                      )}
                      {grupo.correo && (
                        <Button
                          variant="ghost"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => abrirContactoGrupo(grupo.key, 'correo')}
                        >
                          Correo ({grupo.pedidos.length})
                        </Button>
                      )}
                      {pendientes > 0 && (
                        <Button
                          className="!px-2 !py-1 text-xs"
                          disabled={marcarGrupoSolicitadoMut.isPending}
                          onClick={() => marcarGrupoSolicitadoMut.mutate(grupo)}
                        >
                          Marcar solicitados
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <ul className="space-y-2">
                  {grupo.pedidos.map((p) => renderPedidoRow(p, { ocultarContacto: true }))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {internos.length > 0 && (
        <div className={gruposProveedor.length > 0 ? 'mt-4' : ''}>
          {gruposProveedor.length > 0 && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-outline">
              Internos
            </p>
          )}
          <ul className="space-y-2">{internos.map((p) => renderPedidoRow(p))}</ul>
        </div>
      )}

      <PedidoFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fechaEvento={fechaEvento}
        productos={productos}
        proveedores={proveedores}
        onSubmit={async (payload) => {
          await crearMut.mutateAsync(payload);
        }}
      />

      {grupoContacto && eventoContactoResumen && contactoCanal === 'whatsapp' && (
        <PedidoProveedorWhatsAppModal
          open
          onClose={cerrarContacto}
          pedidos={grupoContacto.pedidos}
          evento={eventoContactoResumen}
        />
      )}
      {grupoContacto && eventoContactoResumen && contactoCanal === 'correo' && (
        <EnviarPedidoProveedorCorreoModal
          open
          onClose={cerrarContacto}
          pedidos={grupoContacto.pedidos}
          evento={eventoContactoResumen}
        />
      )}
    </section>
  );
}
