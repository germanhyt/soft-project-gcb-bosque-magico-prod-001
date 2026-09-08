-- Extras permitidos: flag de catálogo + lista/comentario por cotización (van al contrato).
ALTER TABLE "productos" ADD COLUMN "extra_permitido" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "cotizaciones" ADD COLUMN "extras_permitidos" JSONB;
ALTER TABLE "cotizaciones" ADD COLUMN "extras_permitidos_comentario" TEXT;

-- Predeterminados del contrato físico (Piñata y Torta temática).
INSERT INTO "productos" (
  "id",
  "codigo",
  "nombre",
  "categoria",
  "precio_lunes_viernes",
  "precio_fin_semana",
  "unidad",
  "extra_permitido",
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
  v.codigo,
  v.nombre,
  'extra'::"CategoriaProducto",
  0,
  0,
  'servicio',
  true,
  1,
  v.descripcion,
  'activo'::"EtapaProducto",
  'propio'::"OrigenProducto",
  'general'::"SubtipoProducto",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('EXT-PINATA', 'Piñata', 'Extra permitido en contrato: el cliente puede traer piñata sin cobro automático.'),
    ('EXT-TORTA', 'Torta temática', 'Extra permitido en contrato: el cliente puede traer torta temática sin cobro automático.')
) AS v(codigo, nombre, descripcion)
WHERE NOT EXISTS (
  SELECT 1 FROM "productos" p WHERE p."codigo" = v.codigo
);

UPDATE "productos"
SET "extra_permitido" = true,
    "unidad" = 'servicio'
WHERE "codigo" IN ('EXT-PINATA', 'EXT-TORTA');
