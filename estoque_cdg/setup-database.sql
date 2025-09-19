-- SQL para criar as tabelas do sistema de estoque CDG
-- Execute este script no seu banco PostgreSQL

-- Criar ENUMs
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'SAIDA');

-- Tabela de usuários
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Tabela de categorias
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Tabela de produtos
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "unitsPerPackage" INTEGER NOT NULL DEFAULT 1,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- Tabela de movimentações
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "packageQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalUnits" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "user" TEXT NOT NULL DEFAULT 'Sistema',
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- Criar índices únicos
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- Adicionar chaves estrangeiras
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movements" ADD CONSTRAINT "movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Inserir categorias iniciais
INSERT INTO "categories" ("id", "name", "description", "isActive", "createdAt", "updatedAt") VALUES 
('cat_papelaria', 'Papelaria', 'Produtos de papel e escritório', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_limpeza', 'Material de Limpeza', 'Produtos para limpeza e higiene', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_eletronicos', 'Eletrônicos', 'Equipamentos e acessórios eletrônicos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Inserir produtos de exemplo
INSERT INTO "products" ("id", "name", "code", "description", "categoryId", "unitsPerPackage", "quantity", "price", "isActive", "createdAt", "updatedAt") VALUES 
('prod_papel_a4', 'Papel A4 Chamex', 'PAP001', 'Papel A4 branco 75g/m²', 'cat_papelaria', 500, 2300, 25.90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod_detergente', 'Detergente Líquido', 'LMP001', 'Detergente neutro 500ml', 'cat_limpeza', 12, 87, 3.50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('prod_mouse', 'Mouse Óptico USB', 'ELE001', 'Mouse óptico com fio USB', 'cat_eletronicos', 1, 15, 29.90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT;