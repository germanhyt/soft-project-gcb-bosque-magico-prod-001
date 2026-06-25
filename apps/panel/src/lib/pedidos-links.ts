export function linkPedidoProveedorCompleto(tokenOrLink: string) {
  const base = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://localhost:5173';
  if (tokenOrLink.startsWith('http')) return tokenOrLink;
  if (tokenOrLink.startsWith('/')) return `${base.replace(/\/+$/, '')}${tokenOrLink}`;
  return `${base.replace(/\/+$/, '')}/pedido-proveedor/${tokenOrLink}`;
}
