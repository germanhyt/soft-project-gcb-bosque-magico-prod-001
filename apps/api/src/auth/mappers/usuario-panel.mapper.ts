export function mapUsuarioPanel(usuario: {
  id: string;
  email: string;
  nombre: string;
  permisos: string[];
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
}) {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    permisos: usuario.permisos,
    activo: usuario.activo,
    creadoEn: usuario.creadoEn.toISOString(),
    actualizadoEn: usuario.actualizadoEn.toISOString(),
  };
}
