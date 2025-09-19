import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ProductSchema, ProductFiltersSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      name: searchParams.get("name") || undefined,
      code: searchParams.get("code") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      isActive: searchParams.get("isActive") ? searchParams.get("isActive") === "true" : undefined,
      lowStock: searchParams.get("lowStock") ? searchParams.get("lowStock") === "true" : undefined,
    }

    const validatedFilters = ProductFiltersSchema.parse(filters)

    const where: any = {}
    
    if (validatedFilters.name) {
      where.name = { contains: validatedFilters.name, mode: 'insensitive' }
    }
    if (validatedFilters.code) {
      where.code = { contains: validatedFilters.code, mode: 'insensitive' }
    }
    if (validatedFilters.categoryId) {
      where.categoryId = validatedFilters.categoryId
    }
    if (validatedFilters.isActive !== undefined) {
      where.isActive = validatedFilters.isActive
    }
    if (validatedFilters.lowStock) {
      where.quantity = { lte: 10 } // Considera baixo estoque <= 10 unidades
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = ProductSchema.parse(body)

    // Verificar se código já existe
    const existingProduct = await prisma.product.findUnique({
      where: { code: validatedData.code }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "Já existe um produto com este código" },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: validatedData,
      include: {
        category: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error("Error creating product:", error)
    
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