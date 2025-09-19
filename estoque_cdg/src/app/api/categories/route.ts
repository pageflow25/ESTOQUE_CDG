import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CategorySchema } from "@/lib/validations"

// GET /api/categories - Listar categorias
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/categories - Criar categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CategorySchema.parse(body)

    const category = await prisma.category.create({
      data: validatedData
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error("Error creating category:", error)
    
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