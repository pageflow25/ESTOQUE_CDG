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
    
    -- Adicionar coluna packageType se não existir  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Movement' 
        AND column_name = 'packageType'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Movement" ADD COLUMN "packageType" TEXT NOT NULL DEFAULT 'unidade';
        RAISE NOTICE 'Coluna packageType adicionada à tabela Movement';
    ELSE
        RAISE NOTICE 'Coluna packageType já existe na tabela Movement';
    END IF;
END $$;

-- Atualizar movimentos existentes com valores baseados no produto (se houver dados)
-- Primeiro, vamos verificar se existe a coluna unitsPerPackage na tabela Product
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' 
        AND column_name = 'unitsPerPackage'
        AND table_schema = 'public'
    ) THEN
        -- Se existe, usar os valores do produto para atualizar movimentos
        UPDATE "Movement" 
        SET 
            "unitsPerPackage" = COALESCE(p."unitsPerPackage", 1),
            "packageType" = COALESCE(p."packageType", 'unidade')
        FROM "Product" p 
        WHERE "Movement"."productId" = p."id"
        AND ("Movement"."unitsPerPackage" = 1 OR "Movement"."packageType" = 'unidade');
        
        RAISE NOTICE 'Movimentos atualizados com dados dos produtos';
    ELSE
        -- Se não existe, usar valores padrão inteligentes baseados no nome do produto
        UPDATE "Movement" 
        SET 
            "unitsPerPackage" = CASE 
                WHEN EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "Movement"."productId" AND p."name" ILIKE '%papel%A4%') THEN 500
                WHEN EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "Movement"."productId" AND p."name" ILIKE '%detergente%') THEN 12
                WHEN EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "Movement"."productId" AND p."name" ILIKE '%sabao%') THEN 20
                ELSE 1
            END,
            "packageType" = CASE 
                WHEN EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "Movement"."productId" AND p."name" ILIKE '%papel%A4%') THEN 'resma'
                WHEN EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "Movement"."productId" AND p."name" ILIKE '%detergente%') THEN 'caixa'
                WHEN EXISTS (SELECT 1 FROM "Product" p WHERE p."id" = "Movement"."productId" AND p."name" ILIKE '%sabao%') THEN 'pacote'
                ELSE 'unidade'
            END
        WHERE "unitsPerPackage" = 1 AND "packageType" = 'unidade';
        
        RAISE NOTICE 'Movimentos atualizados com valores padrão baseados no nome do produto';
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

-- Mostrar estrutura das colunas relevantes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('Product', 'Movement', 'Category')
AND table_schema = 'public'
AND column_name IN ('unitsPerPackage', 'packageType', 'totalUnits', 'packageQuantity')
ORDER BY table_name, ordinal_position;

COMMIT;

-- Para executar este script:
-- 1. Abra o SQL Editor no Supabase Dashboard
-- 2. Cole este script completo
-- 3. Execute
-- 
-- Ou via psql:
-- psql "sua-connection-string" -f update-variable-packaging.sql