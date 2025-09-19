-- Script para ATUALIZAR tabelas existentes do sistema de estoque CDG
-- Use este script se você já tem algumas tabelas e precisa apenas atualizar

-- Criar ENUMs se não existirem
DO $$ BEGIN
    CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'SAIDA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela categories se não existir
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Atualizar tabela products
DO $$ 
BEGIN
    -- Adicionar coluna categoryId se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='categoryId') THEN
        ALTER TABLE "products" ADD COLUMN "categoryId" TEXT;
    END IF;
    
    -- Adicionar coluna code se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='code') THEN
        ALTER TABLE "products" ADD COLUMN "code" TEXT;
    END IF;
    
    -- Adicionar coluna unitsPerPackage se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='unitsPerPackage') THEN
        ALTER TABLE "products" ADD COLUMN "unitsPerPackage" INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    -- Adicionar coluna quantity se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='quantity') THEN
        ALTER TABLE "products" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Adicionar coluna price se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN
        ALTER TABLE "products" ADD COLUMN "price" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
    
    -- Renomear currentStock para quantity se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='currentStock') THEN
        ALTER TABLE "products" RENAME COLUMN "currentStock" TO "quantity";
    END IF;
    
    -- Renomear unitPrice para price se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='unitPrice') THEN
        ALTER TABLE "products" RENAME COLUMN "unitPrice" TO "price";
    END IF;
END $$;

-- Atualizar tabela movements
DO $$
BEGIN
    -- Adicionar coluna packageQuantity se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movements' AND column_name='packageQuantity') THEN
        ALTER TABLE "movements" ADD COLUMN "packageQuantity" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Adicionar coluna unitQuantity se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movements' AND column_name='unitQuantity') THEN
        ALTER TABLE "movements" ADD COLUMN "unitQuantity" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Adicionar coluna totalUnits se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movements' AND column_name='totalUnits') THEN
        ALTER TABLE "movements" ADD COLUMN "totalUnits" INTEGER;
    END IF;
    
    -- Adicionar coluna user se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movements' AND column_name='user') THEN
        ALTER TABLE "movements" ADD COLUMN "user" TEXT NOT NULL DEFAULT 'Sistema';
    END IF;
    
    -- Adicionar coluna notes se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movements' AND column_name='notes') THEN
        ALTER TABLE "movements" ADD COLUMN "notes" TEXT;
    END IF;
    
    -- Atualizar tipo da coluna type se necessário
    ALTER TABLE "movements" ALTER COLUMN "type" TYPE "MovementType" USING "type"::text::"MovementType";
    
    -- Se quantity existir, copie para totalUnits onde totalUnits for null
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movements' AND column_name='quantity') THEN
        UPDATE "movements" SET "totalUnits" = "quantity" WHERE "totalUnits" IS NULL;
    END IF;
END $$;

-- Criar índices únicos se não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'products_code_key') THEN
        CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
    END IF;
END $$;

-- Inserir categorias iniciais se não existirem
INSERT INTO "categories" ("id", "name", "description", "isActive", "createdAt", "updatedAt") 
SELECT 'cat_papelaria', 'Papelaria', 'Produtos de papel e escritório', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "id" = 'cat_papelaria');

INSERT INTO "categories" ("id", "name", "description", "isActive", "createdAt", "updatedAt") 
SELECT 'cat_limpeza', 'Material de Limpeza', 'Produtos para limpeza e higiene', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "id" = 'cat_limpeza');

INSERT INTO "categories" ("id", "name", "description", "isActive", "createdAt", "updatedAt") 
SELECT 'cat_eletronicos', 'Eletrônicos', 'Equipamentos e acessórios eletrônicos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "id" = 'cat_eletronicos');

-- Atualizar produtos existentes com categoryId se estiver NULL
UPDATE "products" SET "categoryId" = 'cat_papelaria' WHERE "categoryId" IS NULL AND "name" ILIKE '%papel%';
UPDATE "products" SET "categoryId" = 'cat_limpeza' WHERE "categoryId" IS NULL AND ("name" ILIKE '%detergente%' OR "name" ILIKE '%limpeza%');
UPDATE "products" SET "categoryId" = 'cat_eletronicos' WHERE "categoryId" IS NULL AND ("name" ILIKE '%mouse%' OR "name" ILIKE '%teclado%' OR "name" ILIKE '%eletr%');
UPDATE "products" SET "categoryId" = 'cat_papelaria' WHERE "categoryId" IS NULL; -- fallback para produtos sem categoria

COMMIT;