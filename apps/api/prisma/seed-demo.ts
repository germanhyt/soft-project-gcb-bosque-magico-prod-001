/**
 * Datos de demostración para probar flujos en panel y landing.
 * Idempotente: puede ejecutarse varias veces (upsert / skip si ya existe).
 * Ejecutar después del seed base: npm run prisma:seed:demo -w @bosque/api
 */
import {
  AreaPedido,
  CanalSolicitud,
  EtapaCotizacion,
  EtapaEvento,
  EtapaPedido,
  EtapaSolicitud,
  EtapaTareaEvento,
  OrigenProducto,
  PrismaClient,
  TipoItemCotizacion,
  TipoPedido,
  TurnoInteres,
} from '@prisma/client';

const TAREAS_DEFECTO = [
  { area: AreaPedido.operaciones, nombre: 'Revisar cotización y logística del evento' },
  { area: AreaPedido.decoracion, nombre: 'Preparar espacio y temática' },
  { area: AreaPedido.catering, nombre: 'Confirmar menú y cantidades' },
  { area: AreaPedido.shows, nombre: 'Coordinar show / animación' },
  { area: AreaPedido.administracion, nombre: 'Verificar contrato y adelanto' },
] as const;

const DEMO_PROVEEDOR_ID = '00000000-0000-4000-8000-000000000001';

const prisma = new PrismaClient();

async function seedSolicitudesBasicas() {
  const existeNueva = await prisma.bosqueMagicoSolicitud.findFirst({
    where: { detalleOrigen: 'seed_demo', etapa: EtapaSolicitud.nueva },
  });
  if (!existeNueva) {
    await prisma.bosqueMagicoSolicitud.create({
      data: {
        nombreContacto: 'Demo Landing — Ana Pérez',
        celular: '999111222',
        correo: 'ana.demo@test.com',
        canal: CanalSolicitud.landing,
        etapa: EtapaSolicitud.nueva,
        fechaIngreso: new Date(),
        fechaTentativa: new Date(Date.now() + 14 * 86400000),
        turnoInteres: TurnoInteres.turno_2,
        cantidadNinosEstimada: 18,
        detalleOrigen: 'seed_demo',
      },
    });
  }

  let solicitudAtencion = await prisma.bosqueMagicoSolicitud.findFirst({
    where: { detalleOrigen: 'seed_demo', etapa: EtapaSolicitud.en_atencion },
  });
  if (!solicitudAtencion) {
    solicitudAtencion = await prisma.bosqueMagicoSolicitud.create({
      data: {
        nombreContacto: 'Demo Manual — Carlos Ruiz',
        celular: '988777666',
        canal: CanalSolicitud.manual,
        etapa: EtapaSolicitud.en_atencion,
        fechaIngreso: new Date(),
        fechaTentativa: new Date(Date.now() + 21 * 86400000),
        turnoInteres: TurnoInteres.turno_1,
        cantidadNinosEstimada: 22,
        notas: 'Cliente pidió cotización por WhatsApp',
        detalleOrigen: 'seed_demo',
      },
    });
  }

  const cotExiste = await prisma.bosqueMagicoCotizacion.findUnique({
    where: { codigo: 'COT-DEMO-001' },
  });
  if (!cotExiste) {
    const cliente = await prisma.bosqueMagicoCliente.create({
      data: {
        nombreCompleto: 'Demo Cliente Cotización',
        celular: '977666555',
        correo: 'cotizacion.demo@test.com',
      },
    });
    const cumpleanero = await prisma.bosqueMagicoCumpleanero.create({
      data: { nombre: 'Mateo', edad: 6, clienteId: cliente.id },
    });
    await prisma.bosqueMagicoCotizacion.create({
      data: {
        codigo: 'COT-DEMO-001',
        tokenPublico: 'demo-token-enviada-' + Date.now(),
        etapa: EtapaCotizacion.enviada,
        clienteId: cliente.id,
        cumpleaneroId: cumpleanero.id,
        solicitudId: solicitudAtencion.id,
        fechaEvento: solicitudAtencion.fechaTentativa!,
        turno: TurnoInteres.turno_1,
        cantidadNinos: 22,
        montoBase: 380,
        montoNinosExtra: 0,
        montoItems: 180,
        montoTotal: 560,
        enviadaEn: new Date(),
      },
    });
  }
}

async function seedOperacionesDemo() {
  const proveedor = await prisma.bosqueMagicoProveedor.upsert({
    where: { id: DEMO_PROVEEDOR_ID },
    create: {
      id: DEMO_PROVEEDOR_ID,
      nombre: 'Show Magic Pro (demo)',
      contacto: 'Luis Animador',
      celular: '955444333',
      correo: 'shows.demo@test.com',
      categorias: ['show'],
      notas: 'Proveedor demo para pruebas operativas',
    },
    update: {
      nombre: 'Show Magic Pro (demo)',
      celular: '955444333',
    },
  });

  const productoShow = await prisma.bosqueMagicoProducto.findUnique({
    where: { codigo: 'SHOW-MIMO' },
  });
  if (productoShow) {
    await prisma.bosqueMagicoProducto.update({
      where: { id: productoShow.id },
      data: {
        origen: OrigenProducto.proveedor,
        proveedorId: proveedor.id,
        costoInterno: 140,
      },
    });
  }

  const eventoExistente = await prisma.bosqueMagicoEvento.findFirst({
    where: { notas: { contains: 'demo para probar pedidos' } },
  });
  if (eventoExistente) {
    return { eventoOps: eventoExistente, proveedor, reused: true };
  }

  const clienteOps = await prisma.bosqueMagicoCliente.create({
    data: {
      nombreCompleto: 'Demo Operaciones — Familia López',
      celular: '966555444',
      correo: 'ops.demo@test.com',
    },
  });

  const cumpleOps = await prisma.bosqueMagicoCumpleanero.create({
    data: { nombre: 'Sofía', edad: 7, clienteId: clienteOps.id },
  });

  const fechaEventoOps = new Date(Date.now() + 10 * 86400000);

  const cotizacionOps = await prisma.bosqueMagicoCotizacion.create({
    data: {
      codigo: `COT-DEMO-OPS-${Date.now()}`,
      tokenPublico: 'demo-token-ops-' + Date.now(),
      etapa: EtapaCotizacion.aceptada,
      clienteId: clienteOps.id,
      cumpleaneroId: cumpleOps.id,
      fechaEvento: fechaEventoOps,
      turno: TurnoInteres.turno_2,
      cantidadNinos: 20,
      montoBase: 580,
      montoNinosExtra: 0,
      montoItems: productoShow ? 240 : 0,
      montoTotal: productoShow ? 820 : 580,
      aceptadaEn: new Date(),
      items: productoShow
        ? {
            create: [
              {
                productoId: productoShow.id,
                tipo: TipoItemCotizacion.show,
                nombre: productoShow.nombre,
                cantidad: 1,
                precioUnitario: 240,
                subtotal: 240,
              },
            ],
          }
        : undefined,
    },
  });

  const eventoOps = await prisma.bosqueMagicoEvento.create({
    data: {
      cotizacionId: cotizacionOps.id,
      clienteId: clienteOps.id,
      cumpleaneroId: cumpleOps.id,
      fechaEvento: fechaEventoOps,
      turno: TurnoInteres.turno_2,
      cantidadNinos: 20,
      montoTotal: cotizacionOps.montoTotal,
      etapa: EtapaEvento.confirmado,
      confirmadoEn: new Date(),
      notas: 'Evento demo para probar pedidos y checklist',
    },
  });

  if (productoShow) {
    await prisma.bosqueMagicoPedido.create({
      data: {
        eventoId: eventoOps.id,
        productoId: productoShow.id,
        proveedorId: proveedor.id,
        tipo: TipoPedido.proveedor,
        nombre: productoShow.nombre,
        cantidad: 1,
        area: AreaPedido.shows,
        fechaRequerida: fechaEventoOps,
        costo: 140,
        etapa: EtapaPedido.solicitado,
        notas: 'Pedido demo generado en seed',
      },
    });
  }

  await prisma.bosqueMagicoTareaEvento.createMany({
    data: TAREAS_DEFECTO.map((t) => ({
      eventoId: eventoOps.id,
      area: t.area,
      nombre: t.nombre,
      fechaVencimiento: fechaEventoOps,
      etapa:
        t.area === AreaPedido.operaciones
          ? EtapaTareaEvento.completado
          : EtapaTareaEvento.pendiente,
    })),
  });

  return { eventoOps, proveedor, reused: false };
}

async function main() {
  await seedSolicitudesBasicas();
  const { eventoOps, proveedor, reused } = await seedOperacionesDemo();

  console.log('Seed demo OK:', {
    eventoOperaciones: eventoOps.id,
    proveedor: proveedor.id,
    reused,
    agendaDetalle: `/agenda?detalle=${eventoOps.id}`,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
