import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MovementSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const type = searchParams.get("type") as "ENTRADA" | "SAIDA" | null

    const where: any = {}
    
    if (productId) {
      where.productId = productId
    }
    if (type) {
      where.type = type
    }

    const movements = await prisma.movement.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(movements)
  } catch (error) {
    console.error("Error fetching movements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = MovementSchema.parse(body)

    // Buscar produto para validar
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      )
    }

    // Calcular nova quantidade do produto
    let newQuantity = product.quantity
    if (validatedData.type === "ENTRADA") {
      newQuantity += validatedData.totalUnits
    } else {
      newQuantity -= validatedData.totalUnits
      
      // Verificar se há estoque suficiente para saída
      if (newQuantity < 0) {
        return NextResponse.json(
          { error: "Estoque insuficiente" },
          { status: 400 }
        )
      }
    }

    // Usar transação para criar movimentação e atualizar estoque
    const result = await prisma.$transaction(async (tx: any) => {
      // Criar movimentação
      const movement = await tx.movement.create({
        data: validatedData,
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      })

      // Atualizar estoque do produto
      await tx.product.update({
        where: { id: validatedData.productId },
        data: { quantity: newQuantity }
      })

      return movement
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error("Error creating movement:", error)
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}