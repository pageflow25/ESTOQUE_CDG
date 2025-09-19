import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cdg.com' },
    update: {},
    create: {
      email: 'admin@cdg.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Admin user created:', admin)

  // Create sample products
  const products = [
    {
      name: 'Papel A4 Sulfite 75g',
      description: 'Papel branco para impressão e cópia',
      material: 'Papel',
      format: 'A4',
      unit: 'resma',
      minStock: 10,
      currentStock: 50,
      unitPrice: 25.90,
      location: 'Estante A - Prateleira 1',
    },
    {
      name: 'Tinta HP 664 Preta',
      description: 'Cartucho de tinta preta original HP',
      material: 'Tinta',
      format: 'Cartucho',
      unit: 'unidade',
      minStock: 5,
      currentStock: 15,
      unitPrice: 89.90,
      location: 'Estante B - Prateleira 2',
    },
    {
      name: 'Papel Fotográfico A4',
      description: 'Papel fotográfico glossy para impressão de fotos',
      material: 'Papel Fotográfico',
      format: 'A4',
      unit: 'pacote',
      minStock: 3,
      currentStock: 8,
      unitPrice: 35.50,
      location: 'Estante C - Prateleira 1',
    },
  ]

  for (const productData of products) {
    await prisma.product.upsert({
      where: { name: productData.name },
      update: {},
      create: productData,
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