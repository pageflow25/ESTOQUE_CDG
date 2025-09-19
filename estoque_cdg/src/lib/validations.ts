import { z } from "zod"

export const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Email deve ser válido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
})

export const LoginSchema = z.object({
  email: z.string().email("Email deve ser válido"),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  material: z.string().min(1, "Material é obrigatório"),
  format: z.string().min(1, "Formato é obrigatório"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  minStock: z.number().min(0, "Estoque mínimo não pode ser negativo"),
  currentStock: z.number().min(0, "Estoque atual não pode ser negativo"),
  unitPrice: z.number().min(0, "Preço unitário não pode ser negativo"),
  location: z.string().optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const MovementSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Produto é obrigatório"),
  type: z.enum(["ENTRADA", "SAIDA"]),
  quantity: z.number().min(1, "Quantidade deve ser maior que zero"),
  unitPrice: z.number().min(0, "Preço unitário não pode ser negativo"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  reference: z.string().optional(),
  date: z.date().optional(),
  userId: z.string().optional(),
})

export const ProductFiltersSchema = z.object({
  name: z.string().optional(),
  material: z.string().optional(),
  format: z.string().optional(),
  isActive: z.boolean().optional(),
  lowStock: z.boolean().optional(),
})

export const MovementFiltersSchema = z.object({
  productId: z.string().optional(),
  type: z.enum(["ENTRADA", "SAIDA"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  reason: z.string().optional(),
})

export type UserInput = z.infer<typeof UserSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type ProductInput = z.infer<typeof ProductSchema>
export type MovementInput = z.infer<typeof MovementSchema>
export type ProductFiltersInput = z.infer<typeof ProductFiltersSchema>
export type MovementFiltersInput = z.infer<typeof MovementFiltersSchema>