/**
 * Sincroniza solo catálogo (productos + composición de paquetes).
 * No modifica configuración ni usuarios.
 *
 * Uso:
 *   npm run prisma:seed:catalogo -w @bosque/api
 *   SEED_SYNC_COMPOSICION=1 npm run prisma:seed:catalogo -w @bosque/api
 */
import { PrismaClient, ModoComposicionPaquete, SubtipoProducto } from '@prisma/client';
import { PIQUEOS_CARTA } from './data/piqueos-carta';
import { CATERING_GENERAL } from './data/catering-catalogo';

const prisma = new PrismaClient();

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
  { codigo: 'EXT-MINIHORALOCA', nombre: 'Mini Hora Loca', categoria: 'extra', lv: 120, fds: 150 },
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

async function upsertProductos() {
  const ids = new Map<string, string>();
  let created = 0;
  let updated = 0;

  for (const p of productos) {
    const existing = await prisma.bosqueMagicoProducto.findUnique({
      where: { codigo: p.codigo },
    });

    const data = {
      nombre: p.nombre,
      categoria: p.categoria,
      precioLunesViernes: p.lv,
      precioFinSemana: p.fds,
      cantidadMinima: p.cantidadMinima ?? (p.categoria === 'catering' && !p.subtipo ? 18 : 1),
      subtipo: p.subtipo ?? 'general',
      unidadesPack: p.unidadesPack,
      unidad: p.unidad ?? 'servicio',
      origen: 'propio' as const,
    };

    if (!existing) {
      const row = await prisma.bosqueMagicoProducto.create({
        data: {
          codigo: p.codigo,
          descripcion: `Producto catálogo ${p.nombre}`,
          ...data,
        },
      });
      ids.set(p.codigo, row.id);
      created += 1;
      continue;
    }

    ids.set(p.codigo, existing.id);
    await prisma.bosqueMagicoProducto.update({
      where: { codigo: p.codigo },
      data,
    });
    updated += 1;
  }

  return { ids, created, updated };
}

async function seedComposicion(ids: Map<string, string>, force: boolean) {
  const reglasPorPaquete: Record<
    string,
    Array<{
      modo: ModoComposicionPaquete;
      componenteCodigo?: string;
      cantidad?: number;
      montoCredito?: number;
      orden: number;
      metadata?: object;
    }>
  > = {
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

  let synced = 0;
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
          componenteId: regla.componenteCodigo ? ids.get(regla.componenteCodigo) : undefined,
          cantidad: regla.cantidad ?? 1,
          montoCredito: regla.montoCredito,
          orden: regla.orden,
          metadata: regla.metadata,
        },
      });
    }
    synced += 1;
  }
  return synced;
}

async function main() {
  const syncComposicion =
    process.env.SEED_SYNC_COMPOSICION === '1' || process.env.SEED_SYNC_COMPOSICION === 'true';

  const { ids, created, updated } = await upsertProductos();
  const composicion = await seedComposicion(ids, syncComposicion);

  console.log('Catálogo sincronizado (sin config ni usuarios):', {
    productosReferenciados: productos.length,
    creados: created,
    actualizados: updated,
    paquetesComposicion: composicion,
    syncComposicion,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
