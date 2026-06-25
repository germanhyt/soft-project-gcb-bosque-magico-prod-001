-- Secuencias atómicas para códigos con prefijo + correlativo
CREATE TABLE "secuencias" (
    "prefijo" TEXT NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,
    "padding" INTEGER NOT NULL DEFAULT 5,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secuencias_pkey" PRIMARY KEY ("prefijo")
);

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT
    'COT-' AS prefijo,
    COALESCE((
        SELECT MAX(CAST(SUBSTRING("codigo" FROM 5) AS INTEGER))
        FROM "cotizaciones"
        WHERE "codigo" ~ '^COT-[0-9]+$'
    ), 0) AS ultimo,
    5 AS padding,
    CURRENT_TIMESTAMP AS actualizado_en;

INSERT INTO "secuencias" ("prefijo", "ultimo", "padding", "actualizado_en")
SELECT
    'BM-CT-' AS prefijo,
    COALESCE((
        SELECT MAX(CAST(SUBSTRING("numero" FROM 7) AS INTEGER))
        FROM "contratos"
        WHERE "numero" ~ '^BM-CT-[0-9]+$'
    ), 0) AS ultimo,
    5 AS padding,
    CURRENT_TIMESTAMP AS actualizado_en;
