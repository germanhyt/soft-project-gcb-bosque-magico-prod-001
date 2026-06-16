-- AlterTable
ALTER TABLE "contratos" ADD COLUMN IF NOT EXISTS "token_publico" TEXT;

UPDATE "contratos"
SET "token_publico" = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
WHERE "token_publico" IS NULL;

ALTER TABLE "contratos" ALTER COLUMN "token_publico" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "contratos_token_publico_key" ON "contratos"("token_publico");
