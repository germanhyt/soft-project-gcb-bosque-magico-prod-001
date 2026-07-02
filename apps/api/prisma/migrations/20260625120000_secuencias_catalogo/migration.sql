-- Secuencias de catálogo por prefijo (SHOW-, PIQ-, etc.)
INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT 'PK-' AS prefijo,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING("codigo" FROM 4) AS INTEGER))
    FROM "productos"
    WHERE "codigo" ~ '^PK-[0-9]+$'
  ), 0) AS ultimo,
  3 AS padding,
  CURRENT_TIMESTAMP AS actualizado_en
ON CONFLICT ("prefijo") DO NOTHING;

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT 'SHOW-' AS prefijo,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING("codigo" FROM 6) AS INTEGER))
    FROM "productos"
    WHERE "codigo" ~ '^SHOW-[0-9]+$'
  ), 0) AS ultimo,
  3 AS padding,
  CURRENT_TIMESTAMP AS actualizado_en
ON CONFLICT ("prefijo") DO NOTHING;

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT 'EXT-' AS prefijo,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING("codigo" FROM 5) AS INTEGER))
    FROM "productos"
    WHERE "codigo" ~ '^EXT-[0-9]+$'
  ), 0) AS ultimo,
  3 AS padding,
  CURRENT_TIMESTAMP AS actualizado_en
ON CONFLICT ("prefijo") DO NOTHING;

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT 'ESP-' AS prefijo,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING("codigo" FROM 5) AS INTEGER))
    FROM "productos"
    WHERE "codigo" ~ '^ESP-[0-9]+$'
  ), 0) AS ultimo,
  3 AS padding,
  CURRENT_TIMESTAMP AS actualizado_en
ON CONFLICT ("prefijo") DO NOTHING;

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT 'CAJ-' AS prefijo,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING("codigo" FROM 5) AS INTEGER))
    FROM "productos"
    WHERE "codigo" ~ '^CAJ-[0-9]+$'
  ), 0) AS ultimo,
  3 AS padding,
  CURRENT_TIMESTAMP AS actualizado_en
ON CONFLICT ("prefijo") DO NOTHING;

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT 'CAT-' AS prefijo,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING("codigo" FROM 5) AS INTEGER))
    FROM "productos"
    WHERE "codigo" ~ '^CAT-[0-9]+$'
  ), 0) AS ultimo,
  3 AS padding,
  CURRENT_TIMESTAMP AS actualizado_en
ON CONFLICT ("prefijo") DO NOTHING;

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT 'PIQ-' AS prefijo,
  COALESCE((
    SELECT MAX(CAST(SUBSTRING("codigo" FROM 5) AS INTEGER))
    FROM "productos"
    WHERE "codigo" ~ '^PIQ-[0-9]+$'
  ), 0) AS ultimo,
  3 AS padding,
  CURRENT_TIMESTAMP AS actualizado_en
ON CONFLICT ("prefijo") DO NOTHING;
