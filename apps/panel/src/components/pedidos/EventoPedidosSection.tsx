import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import type { EtapaPedido } from '../../lib/pedidos';
import { formatFecha } from '../../lib/format';
import { abrirWhatsApp } from '../../lib/whatsapp-cotizacion';
import { mailtoPedidoProveedor, waMeUrlPedidoProveedor } from '../../lib/whatsapp-pedido-proveedor';
import { Button } from '../ui/Button';
import { PedidoFormModal } from './PedidoFormModal';

type Props = {
  eventoId: string;
  fechaEvento: string;
  etapaEvento: string;
  clienteNombre?: string;
  turnoLabel?: string;
};

export function EventoPedidosSection({
  eventoId,
  fechaEvento,
  etapaEvento,
  clienteNombre = '',
  turnoLabel = '',
}: Props) {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const puedeOperar = etapaEvento === 'confirmado' || etapaEvento === 'realizado';

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
    onSuccess: () => invalidate(),
  });

  const totalCosto = pedidos.reduce((n, p) => n + p.costo, 0);

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
        <p className="text-body-sm text-on-surface-variant">
          Los pedidos se gestionan cuando el evento está confirmado.
        </p>
      )}

      {isLoading && <p className="text-body-sm text-outline">Cargando pedidos…</p>}

      {!isLoading && pedidos.length === 0 && etapaEvento !== 'por_confirmar' && (
        <p className="text-body-sm text-on-surface-variant">Sin pedidos registrados.</p>
      )}

      {pedidos.length > 0 && (
        <ul className="space-y-2">
          {pedidos.map((p) => (
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
              {puedeOperar && p.tipo === 'proveedor' && (p.proveedor?.celular || p.proveedor?.correo) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.proveedor?.celular && (
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => {
                        const url = waMeUrlPedidoProveedor(p.proveedor!.celular!, p, {
                          clienteNombre,
                          fechaEvento,
                          turnoLabel,
                        });
                        abrirWhatsApp(url, window.open('about:blank', '_blank'));
                      }}
                    >
                      WhatsApp proveedor
                    </Button>
                  )}
                  {p.proveedor?.correo && (
                    <Button
                      variant="ghost"
                      className="!px-2 !py-1 text-xs"
                      onClick={() => {
                        window.location.href = mailtoPedidoProveedor(p.proveedor!.correo!, p, {
                          clienteNombre,
                          fechaEvento,
                          turnoLabel,
                        });
                      }}
                    >
                      Correo proveedor
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
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
    </section>
  );
}
