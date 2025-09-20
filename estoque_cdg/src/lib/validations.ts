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

export const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  code: z.string().min(1, "Código é obrigatório"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  packageType: z.string().min(1, "Tipo de embalagem é obrigatório").default("Unidade"),
  quantity: z.number().int().min(0, "Quantidade não pode ser negativa"),
  price: z.number().min(0, "Preço não pode ser negativo"),
  isActive: z.boolean().default(true),
})

export const MovementSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Produto é obrigatório"),
  type: z.enum(["ENTRADA", "SAIDA"]),
  packageQuantity: z.number().int().min(0, "Quantidade de embalagens não pode ser negativa"),
  unitsPerPackage: z.number().int().min(1, "Unidades por embalagem deve ser maior que 0"),
  unitQuantity: z.number().int().min(0, "Quantidade de unidades não pode ser negativa"),
  totalUnits: z.number().int().min(1, "Total de unidades deve ser maior que zero"),
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional(),
  date: z.date().optional(),
  userId: z.string().optional(),
  user: z.string().default("Sistema"),
})

export const ProductFiltersSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  categoryId: z.string().optional(),
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