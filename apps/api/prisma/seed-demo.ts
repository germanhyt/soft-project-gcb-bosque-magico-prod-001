/**
 * Datos de demostración para probar flujos en panel y landing.
 * Ejecutar después del seed base: npm run prisma:seed:demo -w @bosque/api
 */
import { PrismaClient, CanalSolicitud, EtapaCotizacion, EtapaSolicitud, TurnoInteres } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const solicitudNueva = await prisma.bosqueMagicoSolicitud.create({
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

  const solicitudAtencion = await prisma.bosqueMagicoSolicitud.create({
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

  const cliente = await prisma.bosqueMagicoCliente.create({
    data: {
      nombreCompleto: 'Demo Cliente Cotización',
      celular: '977666555',
      correo: 'cotizacion.demo@test.com',
    },
  });

  const cumpleanero = await prisma.bosqueMagicoCumpleanero.create({
    data: {
      nombre: 'Mateo',
      edad: 6,
      clienteId: cliente.id,
    },
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

  console.log('Seed demo OK:', {
    solicitudNueva: solicitudNueva.id,
    solicitudAtencion: solicitudAtencion.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
