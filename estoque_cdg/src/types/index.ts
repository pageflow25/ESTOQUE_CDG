export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string
  material: string
  format: string
  unit: string
  minStock: number
  currentStock: number
  unitPrice: number
  location?: string
  barcode?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Movement {
  id: string
  productId: string
  type: 'ENTRADA' | 'SAIDA'
  quantity: number
  unitPrice: number
  totalPrice: number
  reason: string
  reference?: string
  date: Date
  userId?: string
  createdAt: Date
  product?: Product
}

export interface ProductWithMovements extends Product {
  movements: Movement[]
}

export interface MovementFilters {
  productId?: string
  type?: 'ENTRADA' | 'SAIDA'
  startDate?: Date
  endDate?: Date
  reason?: string
}

export interface ProductFilters {
  name?: string
  material?: string
  format?: string
  isActive?: boolean
  lowStock?: boolean
}