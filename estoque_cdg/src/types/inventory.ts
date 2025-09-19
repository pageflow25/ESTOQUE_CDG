// Tipos compartilhados para o sistema de estoque

export interface Category {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PackagingUnit {
  id: string
  name: string // Ex: "Caixa", "Pacote", "Resma", etc.
  unitsPerPackage: number // Quantas unidades individuais tem em uma embalagem
  isDefault?: boolean
}

export interface Product {
  id: string
  name: string
  code: string
  description?: string
  categoryId: string
  category?: Category
  quantity: number // Quantidade total em unidades
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Movement {
  id: string
  type: "entrada" | "saida"
  productId: string
  product?: Product
  // Quantidades com embalagem variável
  packageQuantity: number // Número de caixas/pacotes
  unitsPerPackage: number // Quantas unidades tem em cada embalagem (variável por movimentação)
  unitQuantity: number // Unidades individuais (avulsas)
  totalUnits: number // Total calculado: (packageQuantity * unitsPerPackage) + unitQuantity
  packageType?: string // Tipo da embalagem: "Caixa", "Resma", "Rolo", etc.
  // Dados adicionais
  date: string
  userId: string
  user: string
  reason: string
  notes?: string
  createdAt: string
}

export interface InventoryCalculation {
  totalUnits: number
  packages: number
  remainingUnits: number
  unitsPerPackage: number
}

// Função auxiliar para cálculos de estoque
export function calculateInventory(
  totalUnits: number, 
  unitsPerPackage: number = 1
): InventoryCalculation {
  if (unitsPerPackage <= 1) {
    return {
      totalUnits,
      packages: 0,
      remainingUnits: totalUnits,
      unitsPerPackage: 1
    }
  }

  const packages = Math.floor(totalUnits / unitsPerPackage)
  const remainingUnits = totalUnits % unitsPerPackage

  return {
    totalUnits,
    packages,
    remainingUnits,
    unitsPerPackage
  }
}

// Função para calcular total de unidades a partir de pacotes + unidades
export function calculateTotalUnits(
  packageQuantity: number,
  unitQuantity: number,
  unitsPerPackage: number = 1
): number {
  return (packageQuantity * unitsPerPackage) + unitQuantity
}

// Função para exibir estoque de forma inteligente baseado na última movimentação
export function displayStock(product: Product, lastMovement?: Movement): string {
  if (!lastMovement || lastMovement.unitsPerPackage <= 1) {
    return `${product.quantity} un`
  }

  const calc = calculateInventory(product.quantity, lastMovement.unitsPerPackage)
  return `${calc.packages} ${lastMovement.packageType || 'emb'} + ${calc.remainingUnits} un (${calc.totalUnits} total)`
}