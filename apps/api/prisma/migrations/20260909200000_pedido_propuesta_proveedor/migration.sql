-- Costo estimado y comentario del proveedor (negociación en Pendiente).
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "costo_estimado_proveedor" DECIMAL(10, 2);
ALTER TABLE "pedidos" ADD COLUMN IF NOT EXISTS "comentario_proveedor" TEXT;
