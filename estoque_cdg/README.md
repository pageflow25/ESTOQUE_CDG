# Sistema de Controle de Estoque CDG

Sistema completo de controle de estoque desenvolvido em Next.js para gráficas, com funcionalidades de entrada e saída de produtos, autenticação de usuários, e interface responsiva.

## 🚀 Funcionalidades

### ✅ Implementadas
- **Autenticação de usuários** - Login/logout com NextAuth.js
- **Cadastro de produtos** - Nome, tipo de material, formato, quantidade, preço
- **Controle de estoque** - Registro automático de entradas e saídas
- **Dashboard interativo** - Visão geral com estatísticas e gráficos
- **Gerenciamento de movimentações** - Histórico completo de transações
- **Interface responsiva** - Design limpo e intuitivo
- **Banco de dados relacional** - PostgreSQL com Prisma ORM
- **Arquitetura MVC** - Código organizado e escalável

### 🔄 Recursos principais
- **CRUD completo de produtos**
- **Sistema de movimentação de estoque**
- **Filtros avançados de busca**
- **Alertas de estoque baixo**
- **Registro de usuários e permissões**
- **Validação de dados com Zod**
- **API REST completa**

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Validação**: Zod
- **UI Components**: Radix UI, Lucide React
- **Estilização**: Tailwind CSS

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 18 ou superior)
- PostgreSQL instalado e rodando
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/estoque-cdg.git
cd estoque-cdg
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados

1. Crie um banco PostgreSQL:
```sql
CREATE DATABASE estoque_cdg;
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/estoque_cdg?schema=public"
NEXTAUTH_SECRET="seu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Execute as migrações
```bash
npx prisma migrate dev --name init
```

### 5. Popule o banco com dados iniciais
```bash
npm run db:seed
```

### 6. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 👤 Acesso Inicial

Após executar o seed do banco, você pode fazer login com:
- **Email**: `admin@cdg.com`
- **Senha**: `admin123`

## 🏗️ Estrutura do Projeto

```
src/
├── app/                    # Pages do Next.js 13+ (App Router)
│   ├── api/               # API Routes
│   │   ├── auth/          # NextAuth.js
│   │   ├── products/      # CRUD de produtos
│   │   ├── movements/     # Movimentações
│   │   └── users/         # Usuários
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard principal
│   └── layout.tsx         # Layout global
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   └── navbar.tsx        # Navegação
├── lib/                   # Utilitários e configurações
│   ├── auth.ts           # Configuração NextAuth
│   ├── prisma.ts         # Cliente Prisma
│   ├── utils.ts          # Funções utilitárias
│   └── validations.ts    # Schemas Zod
└── types/                 # Definições TypeScript
prisma/
├── schema.prisma         # Schema do banco de dados
└── seed.ts              # Dados iniciais
```

## 🗄️ Schema do Banco de Dados

### Users
- `id`, `email`, `name`, `password`, `role`, `createdAt`, `updatedAt`

### Products
- `id`, `name`, `description`, `material`, `format`, `unit`
- `minStock`, `currentStock`, `unitPrice`, `location`, `barcode`
- `isActive`, `createdAt`, `updatedAt`

### Movements
- `id`, `productId`, `type` (ENTRADA/SAIDA), `quantity`
- `unitPrice`, `totalPrice`, `reason`, `reference`
- `date`, `userId`, `createdAt`

## 🚀 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Verificar código
npm run db:migrate   # Executar migrações
npm run db:seed      # Popular banco com dados iniciais
npm run db:studio    # Abrir Prisma Studio
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/estoque_cdg"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### Personalização
- **Cores e tema**: Modifique `src/app/globals.css`
- **Componentes UI**: Personalize em `src/components/ui/`
- **Validações**: Ajuste schemas em `src/lib/validations.ts`

## 📋 Funcionalidades Futuras

- [ ] Relatórios avançados com gráficos
- [ ] Exportação para PDF/Excel
- [ ] Sistema de notificações
- [ ] Código de barras automático
- [ ] Integração com fornecedores
- [ ] App mobile com React Native
- [ ] Backup automático
- [ ] Auditoria de ações

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@cdg.com
- 📱 WhatsApp: (11) 99999-9999

---

**Sistema de Estoque CDG** - Desenvolvido com ❤️ para otimizar o controle de materiais gráficos.
