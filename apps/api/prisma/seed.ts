import { PrismaClient, ModoComposicionPaquete, SubtipoProducto } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PIQUEOS_CARTA } from './data/piqueos-carta';
import { CATERING_GENERAL } from './data/catering-catalogo';

const prisma = new PrismaClient();

const PERMISOS_ADMIN = [
  'bosque_magico:view',
  'bosque_magico:manage',
  'bosque_magico:admin',
];

/** Claves de config obsoletas (reemplazadas por shows.* / extras.*). */
const CLAVES_CONFIG_DEPRECADAS = ['tarifas.precio_nino_extra'];

const configuraciones = [
  {
    clave: 'tarifas.base_lunes_viernes',
    valor: 799,
    descripcion: 'Tarifa base por turno de lunes a viernes (S/) — referencia paquete Básico',
    esPublico: true,
  },
  {
    clave: 'tarifas.base_fin_semana',
    valor: 950,
    descripcion: 'Tarifa base por turno sábado y domingo (S/) — referencia paquete Básico',
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
    valor: 20,
    descripcion: 'Capacidad base del evento (shows cubren hasta este tope)',
    esPublico: true,
  },
  {
    clave: 'ninos.maximo_permitido',
    valor: 30,
    descripcion: 'Máximo de niños permitido en reserva regular',
    esPublico: true,
  },
  {
    clave: 'shows.ninos_incluidos',
    valor: 20,
    descripcion: 'Niños incluidos por show sin cargo adicional',
    esPublico: true,
  },
  {
    clave: 'shows.precio_nino_extra',
    valor: 15,
    descripcion: 'Precio por niño adicional en show fuera del rango incluido (S/)',
    esPublico: true,
  },
  {
    clave: 'extras.precio_nino_extra',
    valor: 10,
    descripcion: 'Precio por niño adicional en servicios extra (Pintacaritas, Uñitas, Hora loca, S/)',
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
    clave: 'paquetes.snack_premium_unidades_incluidas',
    valor: 25,
    descripcion: 'Unidades incluidas del carrito snack Premium',
    esPublico: true,
  },
  {
    clave: 'paquetes.snack_premium_precio_excedente',
    valor: 10,
    descripcion: 'Precio por unidad adicional del carrito snack Premium (S/)',
    esPublico: true,
  },
  {
    clave: 'espacio.hora_extra_lunes_viernes',
    valor: 150,
    descripcion: 'Precio por hora adicional de espacio de lunes a viernes (S/)',
    esPublico: true,
  },
  {
    clave: 'espacio.hora_extra_fin_semana',
    valor: 200,
    descripcion: 'Precio por hora adicional de espacio sábado/domingo/feriado (S/)',
    esPublico: true,
  },
  {
    clave: 'extras.salita_lounge',
    valor: 50,
    descripcion: 'Precio por unidad de salita lounge 8 pax (S/)',
    esPublico: true,
  },
  {
    clave: 'extras.ingreso_show_externo',
    valor: 300,
    descripcion: 'Derecho de ingreso de show externo (S/)',
    esPublico: true,
  },
  {
    clave: 'extras.ingreso_decoracion_externo',
    valor: 100,
    descripcion: 'Derecho de ingreso de decoración externo (S/)',
    esPublico: true,
  },
  {
    clave: 'extras.ingreso_carrito_snack_externo',
    valor: 300,
    descripcion: 'Derecho de ingreso de carrito snack externo (S/)',
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
      'Enviar correo automático al proveedor al marcar el pedido como Solicitado (requiere SMTP activo y correo del proveedor).',
    esPublico: false,
  },
  {
    clave: 'pedidos_proveedor.asunto',
    valor: 'Pedido Bosque Mágico — {{servicio}} ({{fecha}})',
    descripcion:
      'Asunto del correo. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{edad}}, {{cantidadNinos}}, {{tematica}}, {{servicio}}, {{cantidad}}, {{costo}}, {{notas}}',
    esPublico: false,
  },
  {
    clave: 'pedidos_proveedor.cuerpo',
    valor:
      'Hola {{proveedor}},\n\nSolicitud de servicio desde Bosque Mágico.\n\nCliente: {{cliente}}\nEvento: {{fecha}} · {{turno}}\nCumpleañero: {{edad}} años\nNiños: {{cantidadNinos}}\nTemática: {{tematica}}\nServicio: {{servicio}}\nCantidad: {{cantidad}}\nCosto referencial: S/ {{costo}}\n{{notas}}\n\nConfirma o rechaza desde este enlace:\n{{link}}',
    descripcion:
      'Cuerpo del correo en texto plano. Placeholders: {{proveedor}}, {{cliente}}, {{fecha}}, {{turno}}, {{edad}}, {{cantidadNinos}}, {{tematica}}, {{servicio}}, {{cantidad}}, {{costo}}, {{notas}}, {{link}}',
    esPublico: false,
  },
  {
    clave: 'recordatorios.habilitado',
    valor: true,
    descripcion:
      'Enviar recordatorio automático de eventos (correo cliente, correo operador y notificación en panel).',
    esPublico: false,
  },
  {
    clave: 'recordatorios.dias_antes',
    valor: 7,
    descripcion: 'Días de anticipación antes del evento (por defecto 7 = una semana).',
    esPublico: false,
  },
  {
    clave: 'recordatorios.correo_operador',
    valor: '',
    descripcion:
      'Correo del operador/sistema. Si queda vacío se usa ADMIN_EMAIL del entorno.',
    esPublico: false,
  },
  {
    clave: 'recordatorios.asunto_cliente',
    valor: 'Recordatorio: tu evento en Bosque Mágico ({{fecha}})',
    descripcion:
      'Asunto al cliente. Placeholders: {{cliente}}, {{fecha}}, {{turno}}, {{paquete}}, {{cumpleanero}}, {{diasAntes}}',
    esPublico: false,
  },
  {
    clave: 'recordatorios.cuerpo_cliente',
    valor:
      'Hola {{cliente}},\n\nTe recordamos que tu evento en Bosque Mágico es el {{fecha}} ({{turno}}).\nCumpleañero: {{cumpleanero}}\nPaquete: {{paquete}}\n\n¡Te esperamos!\nEquipo Bosque Mágico',
    descripcion: 'Cuerpo al cliente (texto plano). Mismos placeholders que el asunto.',
    esPublico: false,
  },
  {
    clave: 'recordatorios.asunto_operador',
    valor: 'Recordatorio operativo — {{cliente}} ({{fecha}})',
    descripcion:
      'Asunto al operador. Placeholders: {{cliente}}, {{correoCliente}}, {{celular}}, {{fecha}}, {{turno}}, {{etapa}}, {{paquete}}, {{cumpleanero}}, {{eventoId}}, {{diasAntes}}',
    esPublico: false,
  },
  {
    clave: 'recordatorios.cuerpo_operador',
    valor:
      'Recordatorio de evento:\n\nCliente: {{cliente}}\nCorreo: {{correoCliente}}\nCelular: {{celular}}\nFecha: {{fecha}} · {{turno}}\nEstado: {{etapa}}\nPaquete: {{paquete}}\nCumpleañero: {{cumpleanero}}\nEvento ID: {{eventoId}}',
    descripcion: 'Cuerpo al operador (texto plano). Mismos placeholders que el asunto.',
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
  { codigo: 'PK-BASICO', nombre: 'Básico', categoria: 'paquete', lv: 799, fds: 950 },
  { codigo: 'PK-ESTANDAR', nombre: 'Estándar', categoria: 'paquete', lv: 1310, fds: 1650 },
  { codigo: 'PK-PREMIUM', nombre: 'Premium', categoria: 'paquete', lv: 1770, fds: 2100 },
  { codigo: 'ESP-ALQ-3H', nombre: 'Alquiler 3 horas', categoria: 'espacio', lv: 0, fds: 0 },
  { codigo: 'CAJ-BOSQUE', nombre: 'Cajita Bosque Mágico', categoria: 'catering', lv: 20.9, fds: 20.9, subtipo: 'cajita', unidad: 'unidad', cantidadMinima: 1 },
  { codigo: 'SHOW-MAGIA', nombre: 'Magia Chispeante', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'SHOW-MIMO', nombre: 'Show Mimo', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'SHOW-BURBUJAS', nombre: 'Burbujas Fantásticas', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'SHOW-DISCO', nombre: 'Silent Disco', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'SHOW-CIENCIA', nombre: 'Show de Ciencia', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'SHOW-COMPETI', nombre: 'Show Competijuegos', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'SHOW-GLOBO', nombre: 'Show Globoflexia', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'SHOW-CINE', nombre: 'Cine al aire libre', categoria: 'show', lv: 520, fds: 690 },
  { codigo: 'EXT-PINTA', nombre: 'Pintacaritas', categoria: 'extra', lv: 190, fds: 250 },
  { codigo: 'EXT-UNITAS', nombre: 'Uñitas (sticker en uñas)', categoria: 'extra', lv: 190, fds: 250 },
  { codigo: 'EXT-HORALOCA', nombre: 'Hora loca', categoria: 'extra', lv: 190, fds: 250 },
  { codigo: 'EXT-ANFITRIONA', nombre: 'Anfitriona', categoria: 'extra', lv: 90, fds: 120 },
  { codigo: 'EXT-ASISTENTE', nombre: 'Asistente de evento', categoria: 'extra', lv: 150, fds: 150 },
  { codigo: 'CAT-POPCORN', nombre: 'Popcorn (carrito snack)', categoria: 'catering', lv: 350, fds: 350, subtipo: 'snack', cantidadMinima: 25, unidad: 'carrito' },
  { codigo: 'CAT-ALGODON', nombre: 'Algodón de azúcar (carrito snack)', categoria: 'catering', lv: 350, fds: 350, subtipo: 'snack', cantidadMinima: 25, unidad: 'carrito' },
  ...CATERING_GENERAL.map((c) => ({
    codigo: c.codigo,
    nombre: c.nombre,
    categoria: 'catering' as const,
    lv: c.precio,
    fds: c.precio,
    subtipo: 'general' as SubtipoProducto,
    cantidadMinima: c.cantidadMinima ?? 18,
    unidad: c.unidad ?? 'porción',
  })),
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

async function eliminarConfigDeprecada() {
  for (const clave of CLAVES_CONFIG_DEPRECADAS) {
    await prisma.bosqueMagicoConfiguracion.deleteMany({ where: { clave } });
  }
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
          unidadesIncluidas: 25,
          precioPack: 350,
          precioUnidadExcedente: 10,
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
  await eliminarConfigDeprecada();

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
