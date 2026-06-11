import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISOS_ADMIN = [
  'bosque_magico:view',
  'bosque_magico:manage',
  'bosque_magico:admin',
];

const configuraciones = [
  {
    clave: 'tarifas.base_lunes_viernes',
    valor: 380,
    descripcion: 'Tarifa base por turno de lunes a viernes (S/)',
    esPublico: true,
  },
  {
    clave: 'tarifas.base_fin_semana',
    valor: 580,
    descripcion: 'Tarifa base por turno sábado y domingo (S/)',
    esPublico: true,
  },
  {
    clave: 'tarifas.precio_nino_extra',
    valor: 25,
    descripcion: 'Precio por niño adicional entre 26 y 35 (S/)',
    esPublico: true,
  },
  {
    clave: 'ninos.minimo',
    valor: 10,
    descripcion: 'Cantidad mínima de niños',
    esPublico: true,
  },
  {
    clave: 'ninos.maximo_base',
    valor: 25,
    descripcion: 'Capacidad base sin cargo extra',
    esPublico: true,
  },
  {
    clave: 'ninos.maximo_permitido',
    valor: 35,
    descripcion: 'Máximo de niños permitido en reserva regular',
    esPublico: true,
  },
  {
    clave: 'contrato.adelanto_referencial',
    valor: 500,
    descripcion: 'Adelanto referencial para separar fecha (S/)',
    esPublico: true,
  },
  {
    clave: 'contrato.garantia_referencial',
    valor: 500,
    descripcion: 'Garantía referencial (S/)',
    esPublico: true,
  },
  {
    clave: 'catering.minimo_unidades',
    valor: 18,
    descripcion: 'Mínimo de unidades por ítem de catering',
    esPublico: true,
  },
  {
    clave: 'calendario.feriados',
    valor: [],
    descripcion:
      'Fechas feriado (YYYY-MM-DD). Aplican tarifa fin de semana aunque caigan entre semana.',
    esPublico: true,
  },
  {
    clave: 'cotizador.shows.selection_mode',
    valor: 'single',
    descripcion: 'Modo de selección de shows en landing: single o multiple',
    esPublico: true,
  },
  {
    clave: 'cotizador.catering.selection_mode',
    valor: 'multiple',
    descripcion: 'Modo de selección de catering en landing: single o multiple',
    esPublico: true,
  },
  {
    clave: 'cotizador.extras.selection_mode',
    valor: 'multiple',
    descripcion: 'Modo de selección de extras en landing: single o multiple',
    esPublico: true,
  },
  {
    clave: 'turnos.turno_1',
    valor: {
      etiqueta: 'Turno 1',
      horaInicio: '09:00',
      horaFin: '12:00',
      horario: '9:00 a.m. - 12:00 m.',
    },
    descripcion: 'Primer turno del día',
    esPublico: true,
  },
  {
    clave: 'turnos.turno_2',
    valor: {
      etiqueta: 'Turno 2',
      horaInicio: '14:00',
      horaFin: '17:00',
      horario: '2:00 p.m. - 5:00 p.m.',
    },
    descripcion: 'Segundo turno del día',
    esPublico: true,
  },
  {
    clave: 'turnos.turno_3',
    valor: {
      etiqueta: 'Turno 3',
      horaInicio: '19:00',
      horaFin: '22:00',
      horario: '7:00 p.m. - 10:00 p.m.',
    },
    descripcion: 'Tercer turno del día',
    esPublico: true,
  },
  {
    clave: 'smtp.habilitado',
    valor: false,
    descripcion: 'Si está desactivado, el panel abrirá tu cliente de correo con el mensaje precargado.',
    esPublico: false,
  },
  {
    clave: 'smtp.host',
    valor: '',
    descripcion: 'Ej: smtp.gmail.com',
    esPublico: false,
  },
  {
    clave: 'smtp.port',
    valor: 587,
    descripcion: '587 (STARTTLS) o 465 (SSL)',
    esPublico: false,
  },
  {
    clave: 'smtp.user',
    valor: '',
    descripcion: 'Cuenta de autenticación SMTP',
    esPublico: false,
  },
  {
    clave: 'smtp.password',
    valor: '',
    descripcion: 'Contraseña o clave de aplicación',
    esPublico: false,
  },
  {
    clave: 'smtp.from_email',
    valor: 'no-reply@bosquemagico.test',
    descripcion: 'Dirección que verá el cliente como remitente',
    esPublico: false,
  },
  {
    clave: 'smtp.from_name',
    valor: 'Bosque Magico',
    descripcion: 'Nombre visible del remitente',
    esPublico: false,
  },
  {
    clave: 'smtp.secure',
    valor: false,
    descripcion: 'Usar SSL directo (puerto 465). Para 587 dejar en No.',
    esPublico: false,
  },
];

const productos = [
  { codigo: 'PK-BASICO', nombre: 'Básico', categoria: 'paquete' as const, lv: 380, fds: 580 },
  { codigo: 'PK-ESTANDAR', nombre: 'Estándar', categoria: 'paquete' as const, lv: 480, fds: 680 },
  { codigo: 'PK-PREMIUM', nombre: 'Premium', categoria: 'paquete' as const, lv: 580, fds: 780 },
  { codigo: 'SHOW-MAGIA', nombre: 'Magia Chispeante', categoria: 'show' as const, lv: 180, fds: 220 },
  { codigo: 'SHOW-MIMO', nombre: 'Show Mimo', categoria: 'show' as const, lv: 200, fds: 240 },
  { codigo: 'SHOW-BURBUJAS', nombre: 'Burbujas Fantásticas', categoria: 'show' as const, lv: 220, fds: 260 },
  { codigo: 'SHOW-DISCO', nombre: 'Silent Disco', categoria: 'show' as const, lv: 350, fds: 400 },
  { codigo: 'EXT-PINTA', nombre: 'Pintacaritas', categoria: 'extra' as const, lv: 120, fds: 150 },
  { codigo: 'EXT-ANFITRIONA', nombre: 'Anfitriona', categoria: 'extra' as const, lv: 90, fds: 120 },
  { codigo: 'EXT-DECOR', nombre: 'Arco decorativo', categoria: 'extra' as const, lv: 180, fds: 220 },
  { codigo: 'CAT-POPCORN', nombre: 'Popcorn', categoria: 'catering' as const, lv: 3.5, fds: 3.5 },
  { codigo: 'CAT-ALGODON', nombre: 'Algodón de azúcar', categoria: 'catering' as const, lv: 4, fds: 4 },
  { codigo: 'CAT-GELATINA', nombre: 'Gelatina', categoria: 'catering' as const, lv: 3, fds: 3 },
  { codigo: 'CAT-ARROZ', nombre: 'Arroz con leche', categoria: 'catering' as const, lv: 3.5, fds: 3.5 },
];

async function main() {
  for (const config of configuraciones) {
    await prisma.bosqueMagicoConfiguracion.upsert({
      where: { clave: config.clave },
      update: {
        valor: config.valor,
        descripcion: config.descripcion,
        esPublico: config.esPublico,
      },
      create: config,
    });
  }
  for (const p of productos) {
    await prisma.bosqueMagicoProducto.upsert({
      where: { codigo: p.codigo },
      update: {
        nombre: p.nombre,
        precioLunesViernes: p.lv,
        precioFinSemana: p.fds,
        cantidadMinima: p.categoria === 'catering' ? 18 : 1,
      },
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria,
        precioLunesViernes: p.lv,
        precioFinSemana: p.fds,
        cantidadMinima: p.categoria === 'catering' ? 18 : 1,
        descripcion: `Producto catálogo ${p.nombre}`,
      },
    });
  }
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@bosquemagico.test').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'BosqueDev123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.bosqueMagicoUsuario.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      nombre: 'Administrador',
      passwordHash,
      permisos: PERMISOS_ADMIN,
      activo: true,
    },
    update: {
      nombre: 'Administrador',
      passwordHash,
      permisos: PERMISOS_ADMIN,
      activo: true,
    },
  });

  console.log(
    `Semilla aplicada: ${configuraciones.length} configuraciones, ${productos.length} productos, usuario ${adminEmail}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
