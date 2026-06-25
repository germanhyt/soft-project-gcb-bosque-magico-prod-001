import { PrismaClient, ModoComposicionPaquete, SubtipoProducto } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PIQUEOS_CARTA } from './data/piqueos-carta';

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
    descripcion: 'Tarifa base por turno de lunes a viernes (S/) — referencia paquete Básico',
    esPublico: true,
  },
  {
    clave: 'tarifas.base_fin_semana',
    valor: 580,
    descripcion: 'Tarifa base por turno sábado y domingo (S/) — referencia paquete Básico',
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
    clave: 'solicitud.min_dias_anticipacion',
    valor: 7,
    descripcion: 'Días mínimos de anticipación para solicitar un evento (ej. 7 = una semana)',
    esPublico: true,
  },
  {
    clave: 'paquetes.cajitas_incluidas',
    valor: 10,
    descripcion: 'Cajitas Bosque Mágico incluidas por paquete',
    esPublico: true,
  },
  {
    clave: 'paquetes.cajitas_precio_excedente',
    valor: 20.9,
    descripcion: 'Precio por cajita adicional (S/)',
    esPublico: true,
  },
  {
    clave: 'paquetes.piqueos_credito_premium',
    valor: 200,
    descripcion: 'Crédito de piqueos incluido en paquete Premium (S/)',
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
    descripcion: 'Mínimo de unidades por ítem de catering genérico (no aplica a piqueos/cajitas)',
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
  {
    clave: 'postventa.habilitado',
    valor: false,
    descripcion: 'Enviar correo con formulario de satisfacción al marcar evento como realizado.',
    esPublico: false,
  },
  {
    clave: 'postventa.url_formulario',
    valor: '',
    descripcion: 'Enlace al formulario (Google Forms, Typeform, etc.)',
    esPublico: false,
  },
  {
    clave: 'postventa.asunto',
    valor: 'Cuéntanos tu experiencia en Bosque Mágico',
    descripcion: 'Asunto del correo. Placeholders: {{cliente}}, {{url}}, {{evento}}, {{fecha}}',
    esPublico: false,
  },
  {
    clave: 'postventa.cuerpo',
    valor:
      'Hola {{cliente}},\n\nGracias por celebrar con nosotros en Bosque Mágico. Nos encantaría conocer tu opinión completando este breve formulario:\n\n{{url}}\n\n¡Hasta pronto!\nEquipo Bosque Mágico',
    descripcion: 'Cuerpo del correo en texto plano. Mismos placeholders que el asunto.',
    esPublico: false,
  },
  {
    clave: 'pedidos_proveedor.notificar_correo',
    valor: false,
    descripcion:
      'Enviar correo automático al proveedor al crear un pedido (requiere SMTP activo y correo del proveedor).',
    esPublico: false,
  },
  {
    clave: 'pedidos_proveedor.asunto',
    valor: 'Pedido Bosque Mágico — {{servicio}} ({{fecha}})',
    descripcion:
      'Asunto del correo. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{servicio}}, {{cantidad}}, {{costo}}, {{notas}}',
    esPublico: false,
  },
  {
    clave: 'pedidos_proveedor.cuerpo',
    valor:
      'Hola {{proveedor}},\n\nSolicitud de servicio desde Bosque Mágico.\n\nCliente: {{cliente}}\nEvento: {{fecha}} · {{turno}}\nServicio: {{servicio}}\nCantidad: {{cantidad}}\nCosto referencial: S/ {{costo}}\n{{notas}}\n\nConfirma o rechaza desde este enlace:\n{{link}}',
    descripcion:
      'Cuerpo del correo en texto plano. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{servicio}}, {{cantidad}}, {{costo}}, {{notas}}, {{link}}',
    esPublico: false,
  },
];

type ProductoSeed = {
  codigo: string;
  nombre: string;
  categoria: 'paquete' | 'show' | 'extra' | 'catering' | 'espacio';
  lv: number;
  fds: number;
  subtipo?: SubtipoProducto;
  unidadesPack?: number;
  cantidadMinima?: number;
  unidad?: string;
};

const productosBase: ProductoSeed[] = [
  { codigo: 'PK-BASICO', nombre: 'Básico', categoria: 'paquete', lv: 380, fds: 580 },
  { codigo: 'PK-ESTANDAR', nombre: 'Estándar', categoria: 'paquete', lv: 480, fds: 680 },
  { codigo: 'PK-PREMIUM', nombre: 'Premium', categoria: 'paquete', lv: 580, fds: 780 },
  { codigo: 'ESP-ALQ-3H', nombre: 'Alquiler 3 horas', categoria: 'espacio', lv: 0, fds: 0 },
  { codigo: 'CAJ-BOSQUE', nombre: 'Cajita Bosque Mágico', categoria: 'catering', lv: 20.9, fds: 20.9, subtipo: 'cajita', unidad: 'unidad', cantidadMinima: 1 },
  { codigo: 'SHOW-MAGIA', nombre: 'Magia Chispeante', categoria: 'show', lv: 180, fds: 220 },
  { codigo: 'SHOW-MIMO', nombre: 'Show Mimo', categoria: 'show', lv: 200, fds: 240 },
  { codigo: 'SHOW-BURBUJAS', nombre: 'Burbujas Fantásticas', categoria: 'show', lv: 220, fds: 260 },
  { codigo: 'SHOW-DISCO', nombre: 'Silent Disco', categoria: 'show', lv: 350, fds: 400 },
  { codigo: 'EXT-PINTA', nombre: 'Pintacaritas', categoria: 'extra', lv: 120, fds: 150 },
  { codigo: 'EXT-ANFITRIONA', nombre: 'Anfitriona', categoria: 'extra', lv: 90, fds: 120 },
  { codigo: 'EXT-ASISTENTE', nombre: 'Asistente de evento', categoria: 'extra', lv: 0, fds: 0 },
  { codigo: 'EXT-DECOR', nombre: 'Arco decorativo', categoria: 'extra', lv: 180, fds: 220 },
  { codigo: 'CAT-POPCORN', nombre: 'Popcorn', categoria: 'catering', lv: 3.5, fds: 3.5, subtipo: 'snack', cantidadMinima: 18 },
  { codigo: 'CAT-ALGODON', nombre: 'Algodón de azúcar', categoria: 'catering', lv: 4, fds: 4, subtipo: 'snack', cantidadMinima: 18 },
  { codigo: 'CAT-GELATINA', nombre: 'Gelatina', categoria: 'catering', lv: 3, fds: 3, cantidadMinima: 18 },
  { codigo: 'CAT-ARROZ', nombre: 'Arroz con leche', categoria: 'catering', lv: 3.5, fds: 3.5, cantidadMinima: 18 },
];

const productosPiqueos: ProductoSeed[] = PIQUEOS_CARTA.map((p) => ({
  codigo: p.codigo,
  nombre: p.nombre,
  categoria: 'catering' as const,
  lv: p.precio,
  fds: p.precio,
  subtipo: 'piqueo' as SubtipoProducto,
  unidadesPack: p.unidadesPack,
  unidad: 'pack',
  cantidadMinima: 1,
}));

const productos = [...productosBase, ...productosPiqueos];

async function ensureConfiguracion(
  config: (typeof configuraciones)[number],
  forceReset: boolean,
): Promise<'created' | 'reset' | 'meta' | 'skipped'> {
  const existing = await prisma.bosqueMagicoConfiguracion.findUnique({
    where: { clave: config.clave },
  });

  if (!existing) {
    await prisma.bosqueMagicoConfiguracion.create({ data: config });
    return 'created';
  }

  if (forceReset) {
    await prisma.bosqueMagicoConfiguracion.update({
      where: { clave: config.clave },
      data: {
        valor: config.valor,
        descripcion: config.descripcion,
        esPublico: config.esPublico,
      },
    });
    return 'reset';
  }

  const metaChanged =
    existing.descripcion !== config.descripcion ||
    existing.esPublico !== config.esPublico;
  if (metaChanged) {
    await prisma.bosqueMagicoConfiguracion.update({
      where: { clave: config.clave },
      data: {
        descripcion: config.descripcion,
        esPublico: config.esPublico,
      },
    });
    return 'meta';
  }

  return 'skipped';
}

async function upsertProductos(syncCatalogo: boolean) {
  const ids = new Map<string, string>();
  for (const p of productos) {
    const existing = await prisma.bosqueMagicoProducto.findUnique({
      where: { codigo: p.codigo },
    });

    if (!existing) {
      const row = await prisma.bosqueMagicoProducto.create({
        data: {
          codigo: p.codigo,
          nombre: p.nombre,
          categoria: p.categoria,
          precioLunesViernes: p.lv,
          precioFinSemana: p.fds,
          cantidadMinima: p.cantidadMinima ?? (p.categoria === 'catering' && !p.subtipo ? 18 : 1),
          subtipo: p.subtipo ?? 'general',
          unidadesPack: p.unidadesPack,
          unidad: p.unidad ?? 'servicio',
          origen: 'propio',
          descripcion: `Producto catálogo ${p.nombre}`,
        },
      });
      ids.set(p.codigo, row.id);
      continue;
    }

    ids.set(p.codigo, existing.id);

    if (!syncCatalogo) continue;

    await prisma.bosqueMagicoProducto.update({
      where: { codigo: p.codigo },
      data: {
        nombre: p.nombre,
        precioLunesViernes: p.lv,
        precioFinSemana: p.fds,
        cantidadMinima: p.cantidadMinima ?? (p.categoria === 'catering' && !p.subtipo ? 18 : 1),
        subtipo: p.subtipo ?? 'general',
        unidadesPack: p.unidadesPack,
        unidad: p.unidad ?? 'servicio',
        origen: 'propio',
      },
    });
  }
  return ids;
}

async function seedComposicion(ids: Map<string, string>, force: boolean) {
  const reglasPorPaquete: Record<string, Array<{
    modo: ModoComposicionPaquete;
    componenteCodigo?: string;
    cantidad?: number;
    montoCredito?: number;
    orden: number;
    metadata?: object;
  }>> = {
    'PK-BASICO': [
      { modo: 'producto_fijo', componenteCodigo: 'ESP-ALQ-3H', cantidad: 1, orden: 1 },
      { modo: 'slot_extra', cantidad: 1, orden: 2 },
      { modo: 'cajitas_incluidas', cantidad: 10, orden: 3 },
    ],
    'PK-ESTANDAR': [
      { modo: 'producto_fijo', componenteCodigo: 'ESP-ALQ-3H', cantidad: 1, orden: 1 },
      { modo: 'slot_show', cantidad: 1, orden: 2 },
      { modo: 'slot_extra', cantidad: 1, orden: 3 },
      { modo: 'cajitas_incluidas', cantidad: 10, orden: 4 },
    ],
    'PK-PREMIUM': [
      { modo: 'producto_fijo', componenteCodigo: 'ESP-ALQ-3H', cantidad: 1, orden: 1 },
      { modo: 'producto_fijo', componenteCodigo: 'EXT-ASISTENTE', cantidad: 1, orden: 2 },
      { modo: 'slot_show', cantidad: 1, orden: 3 },
      { modo: 'slot_extra', cantidad: 1, orden: 4 },
      { modo: 'cajitas_incluidas', cantidad: 10, orden: 5 },
      {
        modo: 'eleccion_snack',
        cantidad: 1,
        orden: 6,
        metadata: {
          productoIds: [ids.get('CAT-POPCORN'), ids.get('CAT-ALGODON')].filter(Boolean),
        },
      },
      { modo: 'credito_piqueos', cantidad: 1, montoCredito: 200, orden: 7 },
    ],
  };

  for (const [codigoPaquete, reglas] of Object.entries(reglasPorPaquete)) {
    const paqueteId = ids.get(codigoPaquete);
    if (!paqueteId) continue;

    const existente = await prisma.bosqueMagicoProductoComposicion.count({
      where: { paqueteId },
    });
    if (existente > 0 && !force) continue;

    await prisma.bosqueMagicoProductoComposicion.deleteMany({
      where: { paqueteId },
    });
    for (const regla of reglas) {
      await prisma.bosqueMagicoProductoComposicion.create({
        data: {
          paqueteId,
          modo: regla.modo,
          componenteId: regla.componenteCodigo
            ? ids.get(regla.componenteCodigo)
            : undefined,
          cantidad: regla.cantidad ?? 1,
          montoCredito: regla.montoCredito,
          orden: regla.orden,
          metadata: regla.metadata,
        },
      });
    }
  }
}

async function ensureAdminUsuario(forceReset: boolean) {
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@bosquemagico.test').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'BosqueDev123!';
  const existing = await prisma.bosqueMagicoUsuario.findUnique({
    where: { email: adminEmail },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.bosqueMagicoUsuario.create({
      data: {
        email: adminEmail,
        nombre: 'Administrador',
        passwordHash,
        permisos: PERMISOS_ADMIN,
        activo: true,
      },
    });
    return { adminEmail, accion: 'created' as const };
  }

  if (forceReset) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.bosqueMagicoUsuario.update({
      where: { email: adminEmail },
      data: {
        nombre: 'Administrador',
        passwordHash,
        permisos: PERMISOS_ADMIN,
        activo: true,
      },
    });
    return { adminEmail, accion: 'reset' as const };
  }

  return { adminEmail, accion: 'skipped' as const };
}

async function main() {
  const forceReset =
    process.env.SEED_FORCE_RESET === '1' || process.env.SEED_FORCE_RESET === 'true';
  const syncCatalogo =
    forceReset ||
    process.env.SEED_SYNC_CATALOGO === '1' ||
    process.env.SEED_SYNC_CATALOGO === 'true';

  let configCreated = 0;
  let configSkipped = 0;
  for (const config of configuraciones) {
    const result = await ensureConfiguracion(config, forceReset);
    if (result === 'created') configCreated += 1;
    else if (result === 'skipped') configSkipped += 1;
  }

  const ids = await upsertProductos(syncCatalogo);
  await seedComposicion(ids, forceReset);
  const admin = await ensureAdminUsuario(forceReset);

  console.log(
    `Semilla aplicada (forceReset=${forceReset}): ` +
      `${configCreated} configs nuevas, ${configSkipped} configs conservadas, ` +
      `${productos.length} productos referenciados, composición de paquetes, ` +
      `usuario ${admin.adminEmail} (${admin.accion}).`,
  );
  if (!forceReset) {
    console.log(
      'Nota: valores existentes de configuración, usuarios y catálogo no se sobrescriben. ' +
        'Use SEED_FORCE_RESET=1 solo para resetear a defaults de desarrollo.',
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
