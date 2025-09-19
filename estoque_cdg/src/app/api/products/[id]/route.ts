import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ProductSchema } from "@/lib/validations"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = ProductSchema.parse(body)

    // Verificar se produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Verificar código único (se mudou)
    if (validatedData.code !== existingProduct.code) {
      const codeExists = await prisma.product.findUnique({
        where: { code: validatedData.code }
      })
      if (codeExists) {
        return NextResponse.json(
          { error: "Já existe um produto com este código" },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        category: true
      }
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error("Error updating product:", error)
    
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se há movimentações
    const productWithMovements = await prisma.product.findUnique({
      where: { id: params.id },
      include: { movements: true }
    })

    if (!productWithMovements) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    if (productWithMovements.movements.length > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir produto com movimentações" },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Produto excluído com sucesso" })
  } catch (error: any) {
    console.error("Error deleting product:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}