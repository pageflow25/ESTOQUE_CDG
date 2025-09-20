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
  -- Garantir que products tenham packageType (fixo por produto)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'packageType'
  ) THEN
    ALTER TABLE "products" ADD COLUMN "packageType" text NOT NULL DEFAULT 'Unidade';
    RAISE NOTICE 'Coluna packageType adicionada em products';
  ELSE
    RAISE NOTICE 'Coluna packageType já existe em products';
  END IF;

  -- Se movements ainda tem packageType (de migrações anteriores), copiar para products quando aplicável e depois remover de movements
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'movements' AND column_name = 'packageType'
  ) THEN
    -- Copiar valores de movements -> products quando product.packageType é default
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

    -- Agora remover a coluna packageType de movements (se estiver presente)
    ALTER TABLE IF EXISTS "movements" DROP COLUMN IF EXISTS "packageType";
    RAISE NOTICE 'Coluna packageType copiada para products e removida de movements';
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
    -- Se products tem unitsPerPackage, copiamos para movements.
    -- Mas somente referência de movements.packageType se essa coluna existir.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'movements' AND column_name = 'packageType'
    ) THEN
      -- movements possui packageType: atualizar unitsPerPackage e packageType a partir de products
      UPDATE "movements" m
      SET "unitsPerPackage" = COALESCE(p."unitsPerPackage", 1),
          "packageType" = COALESCE(p."packageType", 'unidade')
      FROM "products" p
      WHERE m."productId" = p.id
        AND (m."unitsPerPackage" IS NULL OR m."unitsPerPackage" = 1 OR m."packageType" IS NULL OR m."packageType" = 'unidade');
    ELSE
      -- movements não possui packageType: atualizar apenas unitsPerPackage
      UPDATE "movements" m
      SET "unitsPerPackage" = COALESCE(p."unitsPerPackage", 1)
      FROM "products" p
      WHERE m."productId" = p.id
        AND (m."unitsPerPackage" IS NULL OR m."unitsPerPackage" = 1);
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
DO $$
DECLARE
  r RECORD;
  has_pkg boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'movements' AND column_name = 'packageType'
  ) INTO has_pkg;

  IF has_pkg THEN
    RAISE NOTICE 'Mostrando 10 movimentos (inclui packageType):';
    FOR r IN
      SELECT id::text AS id, "productId"::text AS productId, COALESCE("packageQuantity",0)::text AS packageQuantity,
             COALESCE("unitsPerPackage",1)::text AS unitsPerPackage, COALESCE("unitQuantity",0)::text AS unitQuantity,
             COALESCE("totalUnits",0)::text AS totalUnits, COALESCE("packageType",'')::text AS packageType
      FROM "movements"
      ORDER BY "createdAt" DESC
      LIMIT 10
    LOOP
      RAISE NOTICE '% | % | % | % | % | % | %', r.id, r.productid, r.packagequantity, r.unitsperpackage, r.unitquantity, r.totalunits, r.packagetype;
    END LOOP;
  ELSE
    RAISE NOTICE 'Mostrando 10 movimentos (sem packageType):';
    FOR r IN
      SELECT id::text AS id, "productId"::text AS productId, COALESCE("packageQuantity",0)::text AS packageQuantity,
             COALESCE("unitsPerPackage",1)::text AS unitsPerPackage, COALESCE("unitQuantity",0)::text AS unitQuantity,
             COALESCE("totalUnits",0)::text AS totalUnits
      FROM "movements"
      ORDER BY "createdAt" DESC
      LIMIT 10
    LOOP
      RAISE NOTICE '% | % | % | % | % | %', r.id, r.productid, r.packagequantity, r.unitsperpackage, r.unitquantity, r.totalunits;
    END LOOP;
  END IF;
END $$;

-- FIM
