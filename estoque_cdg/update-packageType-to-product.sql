-- Migração: Tornar `packageType` fixo por Product e `unitsPerPackage` variável por Movement
-- O script faz as seguintes ações (seguindo práticas seguras):
-- 1) Garante que a tabela `products` possua a coluna `packageType` (texto, default 'Unidade')
-- 2) Garante que a tabela `movements` possua a coluna `unitsPerPackage` (inteiro, default 1)
-- 3) Se `movements` ainda conter a coluna `packageType` (migrações anteriores), copia o valor mais recente para `products` quando fizer sentido e remove a coluna de `movements`.
-- 4) Recalcula `totalUnits` em `movements` para consistência.
-- IMPORTANTE: Faça backup do banco antes de executar. Teste em staging antes de produção.

BEGIN;

-- 1) Garantir coluna packageType em products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'packageType'
  ) THEN
    ALTER TABLE "products" ADD COLUMN "packageType" text NOT NULL DEFAULT 'Unidade';
    RAISE NOTICE 'Coluna packageType adicionada em products';
  ELSE
    RAISE NOTICE 'Coluna packageType já existe em products';
  END IF;
END $$;

-- 2) Garantir coluna unitsPerPackage em movements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'movements' AND column_name = 'unitsPerPackage'
  ) THEN
    ALTER TABLE "movements" ADD COLUMN "unitsPerPackage" integer NOT NULL DEFAULT 1;
    RAISE NOTICE 'Coluna unitsPerPackage adicionada em movements';
  ELSE
    RAISE NOTICE 'Coluna unitsPerPackage já existe em movements';
  END IF;
END $$;

-- 3) Se movements tiver packageType (de versões antigas), copiar para products e remover de movements
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'movements' AND column_name = 'packageType'
  ) THEN
    -- Copiar o packageType mais recente de movements para products quando o produto ainda tem o valor padrão
    UPDATE "products" p
    SET "packageType" = m."packageType"
    FROM (
      SELECT DISTINCT ON ("productId") "productId", "packageType"
      FROM "movements"
      WHERE "packageType" IS NOT NULL AND "packageType" <> ''
      ORDER BY "productId", "createdAt" DESC
    ) m
    WHERE p.id = m."productId"
      AND (p."packageType" IS NULL OR p."packageType" = 'Unidade');

    RAISE NOTICE 'Valores de packageType copiados de movements para products quando aplicável';

    -- Remover a coluna packageType de movements (agora redundante)
    ALTER TABLE IF EXISTS "movements" DROP COLUMN IF EXISTS "packageType";
    RAISE NOTICE 'Coluna packageType removida de movements';
  ELSE
    RAISE NOTICE 'Movements não possui coluna packageType; nada a copiar/remover';
  END IF;
END $$;

-- 4) Recalcular totalUnits nas movimentações (consistência)
UPDATE "movements"
SET "totalUnits" = (COALESCE("packageQuantity",0) * COALESCE("unitsPerPackage",1)) + COALESCE("unitQuantity",0)
WHERE "totalUnits" IS DISTINCT FROM (COALESCE("packageQuantity",0) * COALESCE("unitsPerPackage",1)) + COALESCE("unitQuantity",0);

COMMIT;

-- Recomendações após execução:
-- - Verifique alguns produtos e movimentos: SELECT id, name, packageType FROM products LIMIT 20;
-- - Verifique movimentos recentes: SELECT id, productId, packageQuantity, unitsPerPackage, unitQuantity, totalUnits FROM movements ORDER BY "createdAt" DESC LIMIT 20;
-- - Se você usar campos legacy (unitsPerPackage/packageType) em outras tabelas, adapte scripts conforme necessário.
-- FIM
