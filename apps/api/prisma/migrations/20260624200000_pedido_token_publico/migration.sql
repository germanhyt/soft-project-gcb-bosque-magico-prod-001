-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN "token_publico" TEXT;

-- Backfill tokens for existing rows
UPDATE "pedidos"
SET "token_publico" = md5(random()::text || "id" || clock_timestamp()::text)
WHERE "token_publico" IS NULL;

ALTER TABLE "pedidos" ALTER COLUMN "token_publico" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_token_publico_key" ON "pedidos"("token_publico");
