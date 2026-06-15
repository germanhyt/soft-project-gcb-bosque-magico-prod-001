/**
 * Limpia solicitudes, cotizaciones y datos derivados de pruebas/demo/QA.
 * Uso: npm run prisma:cleanup -w @bosque/api
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PATRONES_CORREO = [
  '@example.test',
  '@test.com',
  'ana.demo@',
  'cotizacion.demo@',
  'ops.demo@',
  'qa.',
  'qa.manual.',
];

const PATRONES_NOMBRE = [
  'Demo ',
  'QA ',
  'Smoke test',
  'seed_demo',
];

function esDatoPrueba(s: {
  nombreContacto?: string | null;
  correo?: string | null;
  detalleOrigen?: string | null;
  notas?: string | null;
  codigo?: string | null;
  observaciones?: string | null;
}) {
  const texto = [
    s.nombreContacto,
    s.correo,
    s.detalleOrigen,
    s.notas,
    s.codigo,
    s.observaciones,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (s.detalleOrigen === 'seed_demo') return true;
  if (s.codigo?.startsWith('COT-DEMO')) return true;
  if (PATRONES_CORREO.some((p) => texto.includes(p.toLowerCase()))) return true;
  if (PATRONES_NOMBRE.some((p) => texto.includes(p.toLowerCase()))) return true;
  return false;
}

async function eliminarEventosDeCotizaciones(cotizacionIds: string[]) {
  if (!cotizacionIds.length) return;
  const eventos = await prisma.bosqueMagicoEvento.findMany({
    where: { cotizacionId: { in: cotizacionIds } },
    select: { id: true },
  });
  const eventoIds = eventos.map((e) => e.id);
  if (!eventoIds.length) return;

  await prisma.bosqueMagicoPedido.deleteMany({ where: { eventoId: { in: eventoIds } } });
  await prisma.bosqueMagicoTareaEvento.deleteMany({ where: { eventoId: { in: eventoIds } } });
  await prisma.bosqueMagicoContrato.deleteMany({ where: { eventoId: { in: eventoIds } } });
  await prisma.bosqueMagicoEvento.deleteMany({ where: { id: { in: eventoIds } } });
}

async function main() {
  const solicitudes = await prisma.bosqueMagicoSolicitud.findMany({
    select: {
      id: true,
      nombreContacto: true,
      correo: true,
      detalleOrigen: true,
      notas: true,
    },
  });

  const solicitudIdsBorrar = solicitudes
    .filter((s) => esDatoPrueba(s))
    .map((s) => s.id);

  const cotizaciones = await prisma.bosqueMagicoCotizacion.findMany({
    select: {
      id: true,
      codigo: true,
      solicitudId: true,
      notas: true,
      cliente: { select: { nombreCompleto: true, correo: true } },
    },
  });

  const cotizacionIdsBorrar = cotizaciones
    .filter(
      (c) =>
        esDatoPrueba({ codigo: c.codigo, notas: c.notas }) ||
        (c.solicitudId && solicitudIdsBorrar.includes(c.solicitudId)) ||
        esDatoPrueba({
          nombreContacto: c.cliente.nombreCompleto,
          correo: c.cliente.correo ?? undefined,
        }),
    )
    .map((c) => c.id);

  // Cotizaciones huérfanas de demo sin solicitud vinculada
  for (const c of cotizaciones) {
    if (
      c.codigo.startsWith('COT-DEMO') &&
      !cotizacionIdsBorrar.includes(c.id)
    ) {
      cotizacionIdsBorrar.push(c.id);
    }
  }

  await eliminarEventosDeCotizaciones(cotizacionIdsBorrar);

  const logs = await prisma.bosqueMagicoLogMensaje.deleteMany({
    where: { cotizacionId: { in: cotizacionIdsBorrar } },
  });

  const cotDel = await prisma.bosqueMagicoCotizacion.deleteMany({
    where: { id: { in: cotizacionIdsBorrar } },
  });

  const solDel = await prisma.bosqueMagicoSolicitud.deleteMany({
    where: { id: { in: solicitudIdsBorrar } },
  });

  // Clientes demo sin cotizaciones ni eventos
  const clientesHuerfanos = await prisma.bosqueMagicoCliente.findMany({
    where: {
      OR: [
        { correo: { contains: 'demo' } },
        { correo: { contains: 'qa.' } },
        { nombreCompleto: { contains: 'Demo' } },
        { nombreCompleto: { contains: 'QA ' } },
      ],
      cotizaciones: { none: {} },
      eventos: { none: {} },
    },
    select: { id: true },
  });

  if (clientesHuerfanos.length) {
    await prisma.bosqueMagicoCumpleanero.deleteMany({
      where: { clienteId: { in: clientesHuerfanos.map((c) => c.id) } },
    });
    await prisma.bosqueMagicoCliente.deleteMany({
      where: { id: { in: clientesHuerfanos.map((c) => c.id) } },
    });
  }

  console.log('Limpieza OK:', {
    solicitudes: solDel.count,
    cotizaciones: cotDel.count,
    logsMensaje: logs.count,
    clientesHuerfanos: clientesHuerfanos.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
