-- CreateEnum
CREATE TYPE "SubtipoProducto" AS ENUM ('general', 'cajita', 'piqueo', 'snack');

-- CreateEnum
CREATE TYPE "ModoComposicionPaquete" AS ENUM ('producto_fijo', 'slot_show', 'slot_extra', 'cajitas_incluidas', 'credito_piqueos', 'eleccion_snack');

-- CreateEnum
CREATE TYPE "OrigenItemCotizacion" AS ENUM ('incluido_paquete', 'excedente_paquete', 'adicional', 'manual');

-- AlterTable
ALTER TABLE "productos" ADD COLUMN "subtipo" "SubtipoProducto" NOT NULL DEFAULT 'general';
ALTER TABLE "productos" ADD COLUMN "unidades_pack" INTEGER;

-- AlterTable
ALTER TABLE "items_cotizacion" ADD COLUMN "origen_item" "OrigenItemCotizacion" NOT NULL DEFAULT 'manual';
ALTER TABLE "items_cotizacion" ADD COLUMN "credito_aplicado" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "producto_composicion" (
    "id" TEXT NOT NULL,
    "paquete_id" TEXT NOT NULL,
    "modo" "ModoComposicionPaquete" NOT NULL,
    "componente_id" TEXT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "monto_credito" DECIMAL(10,2),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "producto_composicion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "producto_composicion_paquete_id_idx" ON "producto_composicion"("paquete_id");

-- AddForeignKey
ALTER TABLE "producto_composicion" ADD CONSTRAINT "producto_composicion_paquete_id_fkey" FOREIGN KEY ("paquete_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_composicion" ADD CONSTRAINT "producto_composicion_componente_id_fkey" FOREIGN KEY ("componente_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
