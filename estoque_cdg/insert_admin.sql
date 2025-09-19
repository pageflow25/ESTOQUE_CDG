-- Script simples para inserir apenas o usuário admin no Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Verificar se o usuário já existe
SELECT * FROM "users" WHERE email = 'admin@cdg.com';

-- Se não existir, inserir o usuário admin
-- Senha: admin123
INSERT INTO "users" ("id", "email", "name", "password", "role", "createdAt", "updatedAt") 
VALUES (
  'admin001', 
  'admin@cdg.com', 
  'Administrador', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewaMvIhVdx7s2ewy', 
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar se foi inserido
SELECT id, email, name, role, "createdAt" FROM "users" WHERE email = 'admin@cdg.com';