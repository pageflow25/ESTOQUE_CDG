-- SQL para criação do banco de dados no Supabase
-- Sistema de Controle de Estoque CDG

-- Criação dos ENUMs
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'SAIDA');

-- Extensão para gerar CUIDs (se não estiver habilitada)
-- O Supabase já tem essa extensão habilitada por padrão
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para gerar CUID (compatível com Prisma)
-- No Supabase, você pode usar gen_random_uuid() ou criar uma função personalizada
CREATE OR REPLACE FUNCTION generate_cuid()
RETURNS TEXT AS $$
BEGIN
    RETURN 'c' || replace(gen_random_uuid()::text, '-', '');
END;
$$ LANGUAGE plpgsql;

-- Tabela de usuários
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Tabela de produtos
CREATE TABLE "products" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "material" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- Tabela de movimentações
CREATE TABLE "movements" (
    "id" TEXT NOT NULL DEFAULT generate_cuid(),
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- Criação de índices únicos
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- Criação de índices para melhor performance
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_material_idx" ON "products"("material");
CREATE INDEX "products_isActive_idx" ON "products"("isActive");
CREATE INDEX "movements_productId_idx" ON "movements"("productId");
CREATE INDEX "movements_type_idx" ON "movements"("type");
CREATE INDEX "movements_date_idx" ON "movements"("date");
CREATE INDEX "movements_userId_idx" ON "movements"("userId");

-- Adição de chaves estrangeiras
ALTER TABLE "movements" ADD CONSTRAINT "movements_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Função para atualizar o updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updatedAt automaticamente
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON "users" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON "products" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserção de dados iniciais

-- Usuário administrador padrão
-- Senha: admin123 (hash bcrypt)
INSERT INTO "users" ("id", "email", "name", "password", "role") VALUES
('admin001', 'admin@cdg.com', 'Administrador', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewaMvIhVdx7s2ewy', 'ADMIN');

-- Produtos de exemplo
INSERT INTO "products" ("id", "name", "description", "material", "format", "unit", "minStock", "currentStock", "unitPrice", "location") VALUES
('prod001', 'Papel A4 Sulfite 75g', 'Papel branco para impressão e cópia', 'Papel', 'A4', 'resma', 10, 50, 25.90, 'Estante A - Prateleira 1'),
('prod002', 'Tinta HP 664 Preta', 'Cartucho de tinta preta original HP', 'Tinta', 'Cartucho', 'unidade', 5, 15, 89.90, 'Estante B - Prateleira 2'),
('prod003', 'Papel Fotográfico A4', 'Papel fotográfico glossy para impressão de fotos', 'Papel Fotográfico', 'A4', 'pacote', 3, 8, 35.50, 'Estante C - Prateleira 1'),
('prod004', 'Papel A3 Sulfite 75g', 'Papel branco A3 para impressão', 'Papel', 'A3', 'resma', 5, 20, 45.90, 'Estante A - Prateleira 2'),
('prod005', 'Tinta Canon PG-40', 'Cartucho de tinta preta Canon', 'Tinta', 'Cartucho', 'unidade', 3, 10, 75.50, 'Estante B - Prateleira 1');

-- Movimentações de exemplo (entradas iniciais)
INSERT INTO "movements" ("id", "productId", "type", "quantity", "unitPrice", "totalPrice", "reason", "reference", "userId") VALUES
('mov001', 'prod001', 'ENTRADA', 50, 25.90, 1295.00, 'Compra inicial de estoque', 'NF-001', 'admin001'),
('mov002', 'prod002', 'ENTRADA', 15, 89.90, 1348.50, 'Compra inicial de estoque', 'NF-001', 'admin001'),
('mov003', 'prod003', 'ENTRADA', 8, 35.50, 284.00, 'Compra inicial de estoque', 'NF-002', 'admin001'),
('mov004', 'prod004', 'ENTRADA', 20, 45.90, 918.00, 'Compra inicial de estoque', 'NF-002', 'admin001'),
('mov005', 'prod005', 'ENTRADA', 10, 75.50, 755.00, 'Compra inicial de estoque', 'NF-003', 'admin001');

-- Habilitar RLS (Row Level Security) se necessário
-- ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "movements" ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança básicas (opcional)
-- CREATE POLICY "Users can read own data" ON "users" FOR SELECT USING (auth.uid()::text = id);
-- CREATE POLICY "Authenticated users can read products" ON "products" FOR SELECT TO authenticated;
-- CREATE POLICY "Authenticated users can read movements" ON "movements" FOR SELECT TO authenticated;

COMMIT;