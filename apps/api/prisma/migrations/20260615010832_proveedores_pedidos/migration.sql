-- CreateEnum
CREATE TYPE "OrigenProducto" AS ENUM ('propio', 'proveedor');

-- CreateEnum
CREATE TYPE "EtapaProveedor" AS ENUM ('activo', 'inactivo');

-- CreateEnum
CREATE TYPE "TipoPedido" AS ENUM ('interno', 'proveedor');

-- CreateEnum
CREATE TYPE "AreaPedido" AS ENUM ('ventas', 'operaciones', 'decoracion', 'catering', 'shows', 'administracion');

-- CreateEnum
CREATE TYPE "EtapaPedido" AS ENUM ('pendiente', 'solicitado', 'confirmado', 'en_proceso', 'entregado', 'cerrado', 'cancelado');

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "costo_interno" DECIMAL(10,2),
ADD COLUMN     "origen" "OrigenProducto" NOT NULL DEFAULT 'propio',
ADD COLUMN     "proveedor_id" TEXT;

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "celular" TEXT,
    "correo" TEXT,
    "categorias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notas" TEXT,
    "etapa" "EtapaProveedor" NOT NULL DEFAULT 'activo',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "evento_id" TEXT NOT NULL,
    "producto_id" TEXT,
    "proveedor_id" TEXT,
    "tipo" "TipoPedido" NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "area" "AreaPedido" NOT NULL,
    "fecha_requerida" DATE,
    "costo" DECIMAL(10,2) NOT NULL,
    "etapa" "EtapaPedido" NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pedidos_evento_id_idx" ON "pedidos"("evento_id");

-- CreateIndex
CREATE INDEX "pedidos_etapa_idx" ON "pedidos"("etapa");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
