# Configuração do Banco de Dados no Supabase

## 📋 Passo a Passo para Configurar o Banco

### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: `estoque-cdg`
   - **Database Password**: Anote a senha gerada
   - **Region**: Escolha a região mais próxima (ex: South America)

### 2. Executar o Script SQL
1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase_schema.sql`
4. Cole no editor e clique em **Run**

### 3. Configurar Variáveis de Ambiente

Após criar o projeto, você receberá as credenciais. Configure no arquivo `.env`:

```env
# Database URL do Supabase
DATABASE_URL="postgresql://postgres.xxxxx:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres?schema=public&pgbouncer=true&connection_limit=1"

# NextAuth.js
NEXTAUTH_SECRET="seu-secret-key-muito-seguro-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Para produção, use a URL do seu domínio
# NEXTAUTH_URL="https://seu-dominio.vercel.app"
```

### 4. Como Encontrar sua DATABASE_URL no Supabase

1. No painel do Supabase, vá para **Settings** → **Database**
2. Na seção **Connection string**, copie a **URI**
3. Substitua `[YOUR-PASSWORD]` pela senha do banco
4. A URL terá o formato:
   ```
   postgresql://postgres:[SUA_SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

### 5. Verificar se Funcionou

Execute no terminal do projeto:

```bash
# Verificar se o Prisma consegue conectar
npx prisma db pull

# Gerar o cliente Prisma
npx prisma generate

# Testar a aplicação
npm run dev
```

## 🔐 Credenciais de Acesso Inicial

Após executar o script SQL, você pode fazer login com:
- **Email**: `admin@cdg.com`
- **Senha**: `admin123`

## 📊 Dados de Exemplo

O script já inclui:
- ✅ 1 usuário administrador
- ✅ 5 produtos de exemplo
- ✅ 5 movimentações iniciais
- ✅ Índices para performance
- ✅ Triggers para updatedAt automático

## 🛠️ Comandos Úteis

```bash
# Ver o status do banco
npx prisma db pull

# Gerar tipos TypeScript
npx prisma generate

# Abrir interface visual do banco
npx prisma studio

# Reset completo (CUIDADO!)
npx prisma migrate reset
```

## 🔧 Configurações Avançadas (Opcional)

### Habilitar Row Level Security (RLS)
Se quiser maior segurança, descomente as linhas de RLS no final do script SQL.

### Backup Automático
O Supabase já faz backup automático, mas você pode configurar backups adicionais.

### Monitoramento
No painel do Supabase, vá para **Logs** para monitorar queries e performance.

## ❗ Problemas Comuns

### Erro de Conexão
- ✅ Verifique se a senha está correta na DATABASE_URL
- ✅ Confirme que o projeto Supabase está ativo
- ✅ Verifique se não há firewall bloqueando

### Erro de Schema
- ✅ Execute `npx prisma db pull` para sincronizar
- ✅ Execute `npx prisma generate` para atualizar o cliente

### Dados não Aparecem
- ✅ Verifique se o script SQL foi executado completamente
- ✅ No Supabase, vá para **Table Editor** para ver os dados

## 🚀 Deploy em Produção

Para fazer deploy da aplicação:

1. **Vercel** (Recomendado):
   ```bash
   npm run build
   vercel --prod
   ```

2. **Configurar Variáveis de Ambiente no Vercel**:
   - `DATABASE_URL`: URL do Supabase
   - `NEXTAUTH_SECRET`: Chave secreta
   - `NEXTAUTH_URL`: URL do seu domínio

3. **Atualizar CORS no Supabase** (se necessário):
   - Settings → API → CORS Origins
   - Adicionar seu domínio de produção