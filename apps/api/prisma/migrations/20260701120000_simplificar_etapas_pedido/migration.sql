-- Consolidar etapas legacy antes de reducir el enum
UPDATE "pedidos" SET "etapa" = 'confirmado' WHERE "etapa" = 'en_proceso';
UPDATE "pedidos" SET "etapa" = 'entregado' WHERE "etapa" = 'cerrado';

ALTER TYPE "EtapaPedido" RENAME TO "EtapaPedido_old";

CREATE TYPE "EtapaPedido" AS ENUM (
  'pendiente',
  'solicitado',
  'confirmado',
  'entregado',
  'cancelado'
);

ALTER TABLE "pedidos" ALTER COLUMN "etapa" DROP DEFAULT;
ALTER TABLE "pedidos"
  ALTER COLUMN "etapa" TYPE "EtapaPedido"
  USING ("etapa"::text::"EtapaPedido");
ALTER TABLE "pedidos" ALTER COLUMN "etapa" SET DEFAULT 'pendiente';

DROP TYPE "EtapaPedido_old";
