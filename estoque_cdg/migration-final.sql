-- Script SQL final para executar no Supabase
-- Execute este script no SQL Editor do seu painel Supabase

BEGIN;

-- Adicionar as novas colunas na tabela Movement se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Movement' 
        AND column_name = 'unitsPerPackage'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Movement" ADD COLUMN "unitsPerPackage" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Coluna unitsPerPackage adicionada à tabela Movement';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Movement' 
        AND column_name = 'packageType'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE "Movement" ADD COLUMN "packageType" TEXT NOT NULL DEFAULT 'unidade';
        RAISE NOTICE 'Coluna packageType adicionada à tabela Movement';
    END IF;
END $$;

-- Atualizar movimentos existentes com valores baseados no produto
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

-- Recalcular totalUnits para garantir consistência
UPDATE "Movement" 
SET "totalUnits" = ("packageQuantity" * "unitsPerPackage") + "unitQuantity"
WHERE "totalUnits" != (("packageQuantity" * "unitsPerPackage") + "unitQuantity");

COMMIT;

-- Verificação final
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_movements FROM "Movement";
SELECT COUNT(*) as total_products FROM "Product";
SELECT COUNT(*) as total_categories FROM "Category";