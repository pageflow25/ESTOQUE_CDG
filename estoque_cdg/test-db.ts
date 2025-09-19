import { prisma } from './src/lib/prisma'

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Conexão com banco estabelecida')
    
    // Tentar criar uma categoria de teste
    const testCategory = await prisma.category.create({
      data: {
        name: "Papelaria",
        description: "Produtos de papel e escritório",
        isActive: true
      }
    })
    
    console.log('✅ Categoria criada:', testCategory)
    
    // Limpar teste
    await prisma.category.delete({
      where: { id: testCategory.id }
    })
    
    console.log('✅ Teste concluído com sucesso')
  } catch (error) {
    console.error('❌ Erro na conexão:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()