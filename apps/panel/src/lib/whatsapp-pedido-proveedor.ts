import type { Pedido } from './pedidos';
import { linkMailto } from './contacto-links';
import { linkPedidoProveedorCompleto } from './pedidos-links';
import { waMeUrlCotizacion } from './whatsapp-cotizacion';

type EventoResumen = {
  clienteNombre: string;
  fechaEvento: string;
  turnoLabel: string;
};

export function mensajePedidoProveedor(pedido: Pedido, evento: EventoResumen) {
  const proveedor = pedido.proveedor?.nombre ?? 'proveedor';
  const fecha = evento.fechaEvento.slice(0, 10);
  return `Hola ${proveedor}, solicitud de servicio desde Bosque Mágico.

Cliente: ${evento.clienteNombre}
Evento: ${fecha} · ${evento.turnoLabel}
Servicio: ${pedido.nombre}
Cantidad: ${pedido.cantidad}
Costo referencial: S/ ${pedido.costo.toFixed(2)}
${pedido.fechaRequerida ? `Fecha requerida: ${pedido.fechaRequerida.slice(0, 10)}` : ''}
${pedido.notas ? `Notas: ${pedido.notas}` : ''}
${pedido.linkPublico || pedido.tokenPublico ? `\nConfirmar o rechazar:\n${linkPedidoProveedorCompleto(pedido.linkPublico || pedido.tokenPublico!)}` : ''}

Por favor confirmar disponibilidad. Gracias.`;
}

export function asuntoCorreoPedidoProveedor(pedido: Pedido, evento: EventoResumen) {
  const fecha = evento.fechaEvento.slice(0, 10);
  return `Pedido Bosque Mágico — ${pedido.nombre} (${fecha})`;
}

export function waMeUrlPedidoProveedor(celular: string, pedido: Pedido, evento: EventoResumen) {
  return waMeUrlCotizacion(celular, mensajePedidoProveedor(pedido, evento));
}

export function mailtoPedidoProveedor(correo: string, pedido: Pedido, evento: EventoResumen) {
  return linkMailto(correo, asuntoCorreoPedidoProveedor(pedido, evento), mensajePedidoProveedor(pedido, evento));
}
