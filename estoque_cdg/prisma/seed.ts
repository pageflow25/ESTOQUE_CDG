import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  // Criar/atualizar usuários: admin e user
  const adminPassword = await bcrypt.hash('Admin@1234', 12)
  const userPassword = await bcrypt.hash('User@1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {
      name: 'Administrador',
      role: 'ADMIN'
    },
    create: {
      email: 'admin@local.test',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@local.test' },
    update: {
      name: 'Usuário Padrão',
      role: 'USER'
    },
    create: {
      email: 'user@local.test',
      name: 'Usuário Padrão',
      password: userPassword,
      role: 'USER',
    },
  })

  console.log('Usuários criados/atualizados:', admin.email, user.email)

  // Create sample products
  const products = [
    {
      name: 'Papel A4 Sulfite 75g',
      code: 'PAP_A4_75',
      description: 'Papel branco para impressão e cópia',
      categoryName: 'Papel',
      currentStock: 50,
      unitPrice: 25.90,
    },
    {
      name: 'Tinta HP 664 Preta',
      code: 'INK_HP664_BLK',
      description: 'Cartucho de tinta preta original HP',
      categoryName: 'Tinta',
      currentStock: 15,
      unitPrice: 89.90,
    },
    {
      name: 'Papel Fotográfico A4',
      code: 'PAP_FOTO_A4',
      description: 'Papel fotográfico glossy para impressão de fotos',
      categoryName: 'Papel Fotográfico',
      currentStock: 8,
      unitPrice: 35.50,
    },
  ]

  // Função auxiliar para obter ou criar categoria
  async function getOrCreateCategory(name: string) {
    if (!name) { return null }
    let cat = await prisma.category.findFirst({ where: { name } })
    if (!cat) {
      cat = await prisma.category.create({ data: { name, description: '', isActive: true } })
    }
    return cat
  }

  for (const productData of products) {
    const category = await getOrCreateCategory(productData.categoryName)
    const createData: any = {
      name: productData.name,
      code: productData.code,
      description: productData.description,
      quantity: productData.currentStock ?? 0,
      price: productData.unitPrice ?? 0,
      isActive: true,
    }

    if (category) {
      createData.categoryId = category.id
    } else {
      // se não houver categoria, crie sem relação (evita erro se schema exigir categoryId)
      // note: schema exige categoryId; se necessário ajuste manualmente
    }

    await prisma.product.upsert({
      where: { code: productData.code },
      update: createData,
      create: createData,
    })
  }

  console.log('Sample products created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })