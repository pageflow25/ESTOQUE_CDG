import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { ProductSchema, ProductFiltersSchema } from "@/lib/validations"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      name: searchParams.get("name") || undefined,
      material: searchParams.get("material") || undefined,
      format: searchParams.get("format") || undefined,
      isActive: searchParams.get("isActive") ? searchParams.get("isActive") === "true" : undefined,
      lowStock: searchParams.get("lowStock") ? searchParams.get("lowStock") === "true" : undefined,
    }

    const validatedFilters = ProductFiltersSchema.parse(filters)

    const where: any = {}
    
    if (validatedFilters.name) {
      where.name = { contains: validatedFilters.name, mode: 'insensitive' }
    }
    if (validatedFilters.material) {
      where.material = { contains: validatedFilters.material, mode: 'insensitive' }
    }
    if (validatedFilters.format) {
      where.format = { contains: validatedFilters.format, mode: 'insensitive' }
    }
    if (validatedFilters.isActive !== undefined) {
      where.isActive = validatedFilters.isActive
    }
    if (validatedFilters.lowStock) {
      where.currentStock = { lte: where.minStock || 0 }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ProductSchema.parse(body)

    const product = await prisma.product.create({
      data: validatedData,
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