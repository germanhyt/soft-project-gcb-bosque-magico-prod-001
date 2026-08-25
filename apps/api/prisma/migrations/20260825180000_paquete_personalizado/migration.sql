-- Paquete Personalizado en catálogo (idempotente). No altera paquetes existentes.
INSERT INTO "productos" (
  "id",
  "codigo",
  "nombre",
  "categoria",
  "precio_lunes_viernes",
  "precio_fin_semana",
  "unidad",
  "cantidad_minima",
  "descripcion",
  "etapa",
  "origen",
  "subtipo",
  "creado_en",
  "actualizado_en"
)
SELECT
  gen_random_uuid()::text,
  'PK-PERSONALIZADO',
  'Personalizado',
  'paquete'::"CategoriaProducto",
  799.00,
  950.00,
  'servicio',
  1,
  'Producto catálogo Personalizado',
  'activo'::"EtapaProducto",
  'propio'::"OrigenProducto",
  'general'::"SubtipoProducto",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "productos" WHERE "codigo" = 'PK-PERSONALIZADO'
);

-- Misma composición que Básico si aún no tiene reglas.
INSERT INTO "producto_composicion" (
  "id",
  "paquete_id",
  "modo",
  "componente_id",
  "cantidad",
  "monto_credito",
  "orden",
  "metadata"
)
SELECT
  gen_random_uuid()::text,
  pers.id,
  bas_c.modo,
  bas_c.componente_id,
  bas_c.cantidad,
  bas_c.monto_credito,
  bas_c.orden,
  bas_c.metadata
FROM "productos" pers
JOIN "productos" bas ON bas."codigo" = 'PK-BASICO'
JOIN "producto_composicion" bas_c ON bas_c."paquete_id" = bas.id
WHERE pers."codigo" = 'PK-PERSONALIZADO'
  AND NOT EXISTS (
    SELECT 1 FROM "producto_composicion" pc WHERE pc."paquete_id" = pers.id
  );

-- Extra de cotización: derechos de decoración personalizada (S/ 100).
INSERT INTO "configuraciones" (
  "id",
  "clave",
  "valor",
  "descripcion",
  "es_publico",
  "creado_en",
  "actualizado_en"
)
SELECT
  gen_random_uuid()::text,
  'extras.decoracion_personalizada',
  '100'::jsonb,
  'Derechos de decoracion personalizada (S/)',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "configuraciones" WHERE "clave" = 'extras.decoracion_personalizada'
);
