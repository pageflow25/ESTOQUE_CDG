-- Script para atualizar o banco de dados para suportar embalagem variável por movimento
-- Execute este script no seu banco PostgreSQL (Supabase)
-- IMPORTANTE: Execute este script através do SQL Editor do Supabase ou via conexão direta

BEGIN;

-- Primeiro, vamos adicionar as novas colunas na tabela Movement
-- Usando nomes de tabela com aspas para garantir case-sensitivity
DO $$
BEGIN
    -- Adicionar coluna unitsPerPackage se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Movement' 
        AND column_name = 'unitsPerPackage'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Movement" ADD COLUMN "unitsPerPackage" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Coluna unitsPerPackage adicionada à tabela Movement';
    ELSE
        RAISE NOTICE 'Coluna unitsPerPackage já existe na tabela Movement';
    END IF;
    
    -- Garantir que Product tenha packageType (fixo por produto)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'packageType'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "packageType" TEXT NOT NULL DEFAULT 'Unidade';
        RAISE NOTICE 'Coluna packageType adicionada à tabela Product';
    ELSE
        RAISE NOTICE 'Coluna packageType já existe na tabela Product';
    END IF;
END $$;

-- Atualizar movimentos existentes com valores baseados no produto (se houver dados)
-- Primeiro, vamos verificar se existe a coluna unitsPerPackage na tabela Product
DO $$
BEGIN
    -- Garantir que Movement tenha unitsPerPackage
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Movement' 
        AND column_name = 'unitsPerPackage'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Movement" ADD COLUMN "unitsPerPackage" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Coluna unitsPerPackage adicionada à tabela Movement';
    ELSE
        RAISE NOTICE 'Coluna unitsPerPackage já existe na tabela Movement';
    END IF;

    -- Copiar packageType dos produtos para movimentos onde fizer sentido (opcional)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Movement' AND column_name = 'packageType' AND table_schema = 'public') THEN
        -- Se a coluna packageType ainda existir em Movement, popular a partir do Product
        UPDATE "Movement" m
        SET "packageType" = COALESCE(p."packageType", 'Unidade')
        FROM "Product" p
        WHERE m."productId" = p."id"
        AND (m."packageType" IS NULL OR m."packageType" = '' OR m."packageType" = 'unidade');
        RAISE NOTICE 'Movimentos atualizados com packageType dos produtos quando aplicável';
    END IF;
END $$;

-- Recalcular totalUnits para garantir consistência
UPDATE "Movement" 
SET "totalUnits" = ("packageQuantity" * "unitsPerPackage") + "unitQuantity"
WHERE "totalUnits" != (("packageQuantity" * "unitsPerPackage") + "unitQuantity");

-- Agora podemos remover as colunas da tabela Product (OPCIONAL - descomente se quiser)
-- CUIDADO: Só faça isso se tiver certeza de que não precisa mais desses campos no Product
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'unitsPerPackage'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Product" DROP COLUMN "unitsPerPackage";
        RAISE NOTICE 'Coluna unitsPerPackage removida da tabela Product';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'packageType'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Product" DROP COLUMN "packageType";
        RAISE NOTICE 'Coluna packageType removida da tabela Product';
    END IF;
END $$;
*/

-- Verificações finais
DO $$
DECLARE
    product_count INTEGER;
    movement_count INTEGER;
    category_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO product_count FROM "Product";
    SELECT COUNT(*) INTO movement_count FROM "Movement";
    SELECT COUNT(*) INTO category_count FROM "Category";
    
    RAISE NOTICE 'Verificação final:';
    RAISE NOTICE 'Products: % registros', product_count;
    RAISE NOTICE 'Movements: % registros', movement_count;
    RAISE NOTICE 'Categories: % registros', category_count;
END $$;

SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND table_name IN ('Product', 'Movement', 'Category')
    AND column_name IN ('unitsPerPackage', 'packageType', 'totalUnits', 'packageQuantity')
ORDER BY table_name, ordinal_position;

-- Exibir alguns movimentos para validação de forma segura (não referencia packageType se não existir)
DO $$
DECLARE
    r RECORD;
    has_pkg boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Movement' AND column_name = 'packageType'
    ) INTO has_pkg;

    IF has_pkg THEN
        RAISE NOTICE 'Mostrando 10 movimentos (inclui packageType):';
        FOR r IN
            SELECT "id"::text AS id, "productId"::text AS productId, COALESCE("packageQuantity",0)::text AS packageQuantity,
                         COALESCE("unitsPerPackage",1)::text AS unitsPerPackage, COALESCE("unitQuantity",0)::text AS unitQuantity,
                         COALESCE("totalUnits",0)::text AS totalUnits, COALESCE("packageType",'')::text AS packageType
            FROM "Movement"
            ORDER BY "createdAt" DESC
            LIMIT 10
        LOOP
            RAISE NOTICE '% | % | % | % | % | % | %', r.id, r.productid, r.packagequantity, r.unitsperpackage, r.unitquantity, r.totalunits, r.packagetype;
        END LOOP;
    ELSE
        RAISE NOTICE 'Mostrando 10 movimentos (sem packageType):';
        FOR r IN
            SELECT "id"::text AS id, "productId"::text AS productId, COALESCE("packageQuantity",0)::text AS packageQuantity,
                         COALESCE("unitsPerPackage",1)::text AS unitsPerPackage, COALESCE("unitQuantity",0)::text AS unitQuantity,
                         COALESCE("totalUnits",0)::text AS totalUnits
            FROM "Movement"
            ORDER BY "createdAt" DESC
            LIMIT 10
        LOOP
            RAISE NOTICE '% | % | % | % | % | %', r.id, r.productid, r.packagequantity, r.unitsperpackage, r.unitquantity, r.totalunits;
        END LOOP;
    END IF;
END $$;