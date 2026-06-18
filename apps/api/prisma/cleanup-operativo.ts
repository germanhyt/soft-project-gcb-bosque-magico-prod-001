/**
 * Limpia registros operativos hasta la fecha indicada (por defecto: hoy 23:59:59).
 * Mantiene catálogos/configuración/usuarios/proveedores.
 *
 * Uso:
 *   npm run prisma:cleanup:operativo -w @bosque/api
 *   CLEANUP_HASTA=2026-06-17 npm run prisma:cleanup:operativo -w @bosque/api
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseHasta(value?: string): Date {
  if (!value) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }
  const d = new Date(`${value}T23:59:59.999`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`CLEANUP_HASTA inválida: ${value}. Use formato YYYY-MM-DD.`);
  }
  return d;
}

async function tablaExiste(tabla: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ existe: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ${tabla}
    ) AS existe
  `;
  return rows[0]?.existe ?? false;
}

async function main() {
  const hasta = parseHasta(process.env.CLEANUP_HASTA);

  let notificacionIds: string[] = [];
  let estadoNotifCount = 0;
  let notifCount = 0;
  const existePanelNotif = await tablaExiste('panel_notificaciones');
  const existePanelNotifUsuario = await tablaExiste('panel_notificaciones_usuario');

  if (existePanelNotif) {
    const notificaciones = await prisma.bosqueMagicoPanelNotificacion.findMany({
      where: { creadoEn: { lte: hasta } },
      select: { id: true },
    });
    notificacionIds = notificaciones.map((n) => n.id);
  }

  const eventos = await prisma.bosqueMagicoEvento.findMany({
    where: { creadoEn: { lte: hasta } },
    select: { id: true },
  });
  const eventoIds = eventos.map((e) => e.id);

  const cotizaciones = await prisma.bosqueMagicoCotizacion.findMany({
    where: { creadoEn: { lte: hasta } },
    select: { id: true },
  });
  const cotizacionIds = cotizaciones.map((c) => c.id);

  const solicitudIds = (
    await prisma.bosqueMagicoSolicitud.findMany({
      where: { creadoEn: { lte: hasta } },
      select: { id: true },
    })
  ).map((s) => s.id);

  const contratoDel = await prisma.bosqueMagicoContrato.deleteMany({
    where: { creadoEn: { lte: hasta } },
  });

  const pedidoDel = await prisma.bosqueMagicoPedido.deleteMany({
    where: {
      OR: [{ creadoEn: { lte: hasta } }, { eventoId: { in: eventoIds } }],
    },
  });

  const tareaDel = await prisma.bosqueMagicoTareaEvento.deleteMany({
    where: {
      OR: [{ creadoEn: { lte: hasta } }, { eventoId: { in: eventoIds } }],
    },
  });

  if (existePanelNotifUsuario && notificacionIds.length) {
    const estadoNotifDel = await prisma.bosqueMagicoPanelNotificacionUsuario.deleteMany({
      where: { notificacionId: { in: notificacionIds } },
    });
    estadoNotifCount = estadoNotifDel.count;
  }

  if (existePanelNotif && notificacionIds.length) {
    const notifDel = await prisma.bosqueMagicoPanelNotificacion.deleteMany({
      where: { id: { in: notificacionIds } },
    });
    notifCount = notifDel.count;
  }

  const eventoDel = await prisma.bosqueMagicoEvento.deleteMany({
    where: { id: { in: eventoIds } },
  });

  const itemCotDel = await prisma.bosqueMagicoItemCotizacion.deleteMany({
    where: { cotizacionId: { in: cotizacionIds } },
  });

  const logsDel = await prisma.bosqueMagicoLogMensaje.deleteMany({
    where: { cotizacionId: { in: cotizacionIds } },
  });

  const cotDel = await prisma.bosqueMagicoCotizacion.deleteMany({
    where: { id: { in: cotizacionIds } },
  });

  const solDel = await prisma.bosqueMagicoSolicitud.deleteMany({
    where: { id: { in: solicitudIds } },
  });

  const cumpleHuerfanos = await prisma.bosqueMagicoCumpleanero.findMany({
    where: {
      actualizadoEn: { lte: hasta },
      cotizaciones: { none: {} },
      eventos: { none: {} },
    },
    select: { id: true },
  });
  const cumpleIds = cumpleHuerfanos.map((c) => c.id);
  const cumpleDel = cumpleIds.length
    ? await prisma.bosqueMagicoCumpleanero.deleteMany({ where: { id: { in: cumpleIds } } })
    : { count: 0 };

  const clientesHuerfanos = await prisma.bosqueMagicoCliente.findMany({
    where: {
      actualizadoEn: { lte: hasta },
      cotizaciones: { none: {} },
      eventos: { none: {} },
      cumpleaneros: { none: {} },
    },
    select: { id: true },
  });
  const clienteIds = clientesHuerfanos.map((c) => c.id);
  const clienteDel = clienteIds.length
    ? await prisma.bosqueMagicoCliente.deleteMany({ where: { id: { in: clienteIds } } })
    : { count: 0 };

  const auditoriaDel = await prisma.bosqueMagicoAuditoria.deleteMany({
    where: { creadoEn: { lte: hasta } },
  });

  console.log('Limpieza operativa OK:', {
    hasta: hasta.toISOString(),
    contratos: contratoDel.count,
    pedidos: pedidoDel.count,
    tareas: tareaDel.count,
    notificacionesEstado: estadoNotifCount,
    notificaciones: notifCount,
    eventos: eventoDel.count,
    itemsCotizacion: itemCotDel.count,
    logsMensajes: logsDel.count,
    cotizaciones: cotDel.count,
    solicitudes: solDel.count,
    cumpleanerosHuerfanos: cumpleDel.count,
    clientesHuerfanos: clienteDel.count,
    auditorias: auditoriaDel.count,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
