-- update-variable-packaging.sql
-- Script para atualizar o banco de dados PostgreSQL (Supabase) para suportar
-- embalagem variável por movimentação (unitsPerPackage e packageType em Movement)
-- Execute no SQL Editor do Supabase ou via psql

BEGIN;

-- 1) Adicionar colunas em "Movement" se não existirem
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'movements' AND column_name = 'packageType'
  ) THEN
    ALTER TABLE "movements" ADD COLUMN "packageType" text NOT NULL DEFAULT 'unidade';
    RAISE NOTICE 'Coluna packageType adicionada em movements';
  ELSE
    RAISE NOTICE 'Coluna packageType já existe em movements';
  END IF;
END $$;

-- 2) (Opcional) Se você tiver colunas antigas em products para units per package,
-- podemos usar esses valores para preencher movements existentes.
-- Verifica se existe coluna unitsPerPackage em products
DO $$
BEGIN
  -- Verifica existência das colunas específicas em products
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'unitsPerPackage'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'packageType'
    ) THEN
      -- products tem unitsPerPackage e packageType
      UPDATE "movements" m
      SET "unitsPerPackage" = COALESCE(p."unitsPerPackage", 1),
          "packageType" = COALESCE(p."packageType", 'unidade')
      FROM "products" p
      WHERE m."productId" = p.id
        AND (m."unitsPerPackage" IS NULL OR m."unitsPerPackage" = 1 OR m."packageType" IS NULL OR m."packageType" = 'unidade');
    ELSE
      -- products tem apenas unitsPerPackage (packageType não existe)
      UPDATE "movements" m
      SET "unitsPerPackage" = COALESCE(p."unitsPerPackage", 1),
          "packageType" = 'unidade'
      FROM "products" p
      WHERE m."productId" = p.id
        AND (m."unitsPerPackage" IS NULL OR m."unitsPerPackage" = 1 OR m."packageType" IS NULL OR m."packageType" = 'unidade');
    END IF;

    RAISE NOTICE 'Movements atualizados a partir de products (quando aplicável)';
  ELSE
    RAISE NOTICE 'Coluna unitsPerPackage não existe em products; pulando cópia de valores';
  END IF;
END $$;

-- 3) Recalcular totalUnits para consistência
-- Supondo que packageQuantity e unitQuantity existam e sejam inteiros
UPDATE "movements"
SET "totalUnits" = (COALESCE("packageQuantity",0) * COALESCE("unitsPerPackage",1)) + COALESCE("unitQuantity",0)
WHERE "totalUnits" IS DISTINCT FROM (COALESCE("packageQuantity",0) * COALESCE("unitsPerPackage",1)) + COALESCE("unitQuantity",0);

-- 4) (Opcional) Remover colunas antigas de products - DESCOMENTE SOMENTE SE TIVER CERTEZA
-- WARNING: apagar colunas é destrutivo e pode quebrar aplicações que ainda usem esses campos
/*
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'unitsPerPackage'
  ) THEN
    ALTER TABLE "products" DROP COLUMN "unitsPerPackage";
    RAISE NOTICE 'Coluna unitsPerPackage removida de products';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'packageType'
  ) THEN
    ALTER TABLE "products" DROP COLUMN "packageType";
    RAISE NOTICE 'Coluna packageType removida de products';
  END IF;
END $$;
*/

COMMIT;

-- Verificações finais (opcional)
SELECT 'Verificação final - counts' as info;
SELECT COUNT(*) as products_count FROM "products";
SELECT COUNT(*) as movements_count FROM "movements";

-- Exibir alguns movimentos para validação
SELECT "id", "productId", "packageQuantity", "unitsPerPackage", "unitQuantity", "totalUnits", "packageType"
FROM "movements"
ORDER BY "createdAt" DESC
LIMIT 10;

-- FIM
