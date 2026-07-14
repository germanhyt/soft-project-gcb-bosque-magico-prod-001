import type { Pedido } from './pedidos';
import { linkMailto } from './contacto-links';
import { linkPedidoProveedorCompleto } from './pedidos-links';
import { waMeUrlCotizacion } from './whatsapp-cotizacion';

export type PedidoProveedorEventoMsg = {
  clienteNombre: string;
  fechaEvento: string;
  turnoLabel: string;
  cumpleaneroEdad?: number | null;
  cantidadNinos?: number;
  tematica?: string | null;
};

function bloqueEvento(evento: PedidoProveedorEventoMsg) {
  const fecha = evento.fechaEvento.slice(0, 10);
  return `Cliente: ${evento.clienteNombre}
Evento: ${fecha} · ${evento.turnoLabel}
Cumpleañero: ${evento.cumpleaneroEdad ?? 'No especificada'} años
Niños: ${evento.cantidadNinos ?? 'No especificado'}
Temática: ${evento.tematica?.trim() || 'No especificada'}`;
}

function lineaServicio(pedido: Pedido) {
  const link =
    pedido.linkPublico || pedido.tokenPublico
      ? linkPedidoProveedorCompleto(pedido.linkPublico || pedido.tokenPublico!)
      : '';
  const notas = pedido.notas?.trim() ? ` · Notas: ${pedido.notas.trim()}` : '';
  return `• ${pedido.nombre} × ${pedido.cantidad} — S/ ${pedido.costo.toFixed(2)}${notas}${
    link ? `\n  Confirmar: ${link}` : ''
  }`;
}

export function mensajePedidoProveedor(
  pedido: Pedido,
  evento: PedidoProveedorEventoMsg,
) {
  return mensajePedidosProveedorGrupo([pedido], evento);
}

export function mensajePedidosProveedorGrupo(
  pedidos: Pedido[],
  evento: PedidoProveedorEventoMsg,
) {
  const lista = pedidos.filter((p) => p.tipo === 'proveedor');
  const proveedor =
    lista[0]?.proveedor?.nombre ?? pedidos[0]?.proveedor?.nombre ?? 'proveedor';
  const servicios = lista.map(lineaServicio).join('\n');
  return `Hola ${proveedor}, solicitud de servicio desde Bosque Mágico.

${bloqueEvento(evento)}

Servicios (${lista.length}):
${servicios}

Por favor confirmar disponibilidad de cada ítem con su enlace. Gracias.`;
}

export function asuntoCorreoPedidoProveedor(
  pedido: Pedido,
  evento: PedidoProveedorEventoMsg,
) {
  return asuntoCorreoPedidosProveedorGrupo([pedido], evento);
}

export function asuntoCorreoPedidosProveedorGrupo(
  pedidos: Pedido[],
  evento: PedidoProveedorEventoMsg,
) {
  const fecha = evento.fechaEvento.slice(0, 10);
  const proveedor = pedidos[0]?.proveedor?.nombre ?? 'Proveedor';
  if (pedidos.length <= 1) {
    return `Pedido Bosque Mágico — ${pedidos[0]?.nombre ?? 'servicio'} (${fecha})`;
  }
  return `Pedido Bosque Mágico — ${proveedor} (${fecha}) — ${pedidos.length} servicios`;
}

export function waMeUrlPedidoProveedor(
  celular: string,
  pedido: Pedido,
  evento: PedidoProveedorEventoMsg,
) {
  return waMeUrlCotizacion(celular, mensajePedidoProveedor(pedido, evento));
}

export function waMeUrlPedidosProveedorGrupo(
  celular: string,
  pedidos: Pedido[],
  evento: PedidoProveedorEventoMsg,
) {
  return waMeUrlCotizacion(celular, mensajePedidosProveedorGrupo(pedidos, evento));
}

export function mailtoPedidoProveedor(
  correo: string,
  pedido: Pedido,
  evento: PedidoProveedorEventoMsg,
) {
  return linkMailto(
    correo,
    asuntoCorreoPedidoProveedor(pedido, evento),
    mensajePedidoProveedor(pedido, evento),
  );
}

export function mailtoPedidosProveedorGrupo(
  correo: string,
  pedidos: Pedido[],
  evento: PedidoProveedorEventoMsg,
) {
  return linkMailto(
    correo,
    asuntoCorreoPedidosProveedorGrupo(pedidos, evento),
    mensajePedidosProveedorGrupo(pedidos, evento),
  );
}

export type GrupoPedidosProveedor = {
  key: string;
  proveedorId: string | null;
  proveedorNombre: string;
  celular: string | null;
  correo: string | null;
  pedidos: Pedido[];
};

/** Agrupa pedidos de proveedor por proveedorId (o nombre si no hay id). */
export function agruparPedidosPorProveedor(pedidos: Pedido[]): {
  gruposProveedor: GrupoPedidosProveedor[];
  internos: Pedido[];
} {
  const internos = pedidos.filter((p) => p.tipo !== 'proveedor');
  const map = new Map<string, GrupoPedidosProveedor>();

  for (const p of pedidos) {
    if (p.tipo !== 'proveedor') continue;
    const key = p.proveedorId ?? `nombre:${p.proveedor?.nombre ?? p.id}`;
    const existing = map.get(key);
    if (existing) {
      existing.pedidos.push(p);
      continue;
    }
    map.set(key, {
      key,
      proveedorId: p.proveedorId,
      proveedorNombre: p.proveedor?.nombre ?? 'Proveedor',
      celular: p.proveedor?.celular ?? null,
      correo: p.proveedor?.correo ?? null,
      pedidos: [p],
    });
  }

  return {
    gruposProveedor: [...map.values()],
    internos,
  };
}
