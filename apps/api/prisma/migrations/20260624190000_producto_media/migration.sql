-- CreateEnum
CREATE TYPE "TipoMediaProducto" AS ENUM ('imagen', 'video');

-- CreateTable
CREATE TABLE "producto_media" (
    "id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "tipo" "TipoMediaProducto" NOT NULL,
    "url" TEXT NOT NULL,
    "nombre_original" TEXT,
    "mime_type" TEXT,
    "tamano_bytes" INTEGER,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "producto_media_producto_id_tipo_idx" ON "producto_media"("producto_id", "tipo");

-- AddForeignKey
ALTER TABLE "producto_media" ADD CONSTRAINT "producto_media_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar imagen_url existente a galería
INSERT INTO "producto_media" ("id", "producto_id", "tipo", "url", "orden", "creado_en")
SELECT
  gen_random_uuid()::text,
  "id",
  'imagen'::"TipoMediaProducto",
  "imagen_url",
  0,
  NOW()
FROM "productos"
WHERE "imagen_url" IS NOT NULL AND TRIM("imagen_url") <> '';
