// Script para corrigir a senha do usuário admin
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixAdminPassword() {
  try {
    console.log('🔧 Corrigindo senha do usuário admin...')
    
    // Gerar novo hash para a senha 'admin123'
    const hashedPassword = await bcrypt.hash('admin123', 12)
    console.log('🔒 Novo hash gerado:', hashedPassword)
    
    // Atualizar a senha no banco
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@cdg.com' },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })
    
    console.log('✅ Senha atualizada com sucesso!')
    console.log(`   Usuário: ${updatedUser.name} (${updatedUser.email})`)
    
    // Testar a nova senha
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cdg.com' },
    })
    
    if (user) {
      const isPasswordCorrect = await bcrypt.compare('admin123', user.password)
      console.log(`🔐 Teste de senha: ${isPasswordCorrect ? '✅ SUCESSO' : '❌ FALHOU'}`)
    }
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Conexão fechada.')
  }
}

fixAdminPassword()