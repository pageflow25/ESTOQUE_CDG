import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { MovementSchema, MovementFiltersSchema } from "@/lib/validations"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      productId: searchParams.get("productId") || undefined,
      type: searchParams.get("type") as "ENTRADA" | "SAIDA" || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      reason: searchParams.get("reason") || undefined,
    }

    const validatedFilters = MovementFiltersSchema.parse(filters)

    const where: any = {}
    
    if (validatedFilters.productId) {
      where.productId = validatedFilters.productId
    }
    if (validatedFilters.type) {
      where.type = validatedFilters.type
    }
    if (validatedFilters.startDate || validatedFilters.endDate) {
      where.date = {}
      if (validatedFilters.startDate) {
        where.date.gte = validatedFilters.startDate
      }
      if (validatedFilters.endDate) {
        where.date.lte = validatedFilters.endDate
      }
    }
    if (validatedFilters.reason) {
      where.reason = { contains: validatedFilters.reason, mode: 'insensitive' }
    }

    const movements = await prisma.movement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
      },
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = MovementSchema.parse(body)

    // Calculate total price
    const totalPrice = validatedData.quantity * validatedData.unitPrice

    // Start a transaction to update both movement and product stock
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the movement
      const movement = await tx.movement.create({
        data: {
          ...validatedData,
          totalPrice,
          userId: session.user?.id,
          date: validatedData.date || new Date(),
        },
        include: {
          product: true,
        },
      })

      // Update product stock
      const currentProduct = await tx.product.findUnique({
        where: { id: validatedData.productId },
      })

      if (!currentProduct) {
        throw new Error("Product not found")
      }

      const stockChange = validatedData.type === "ENTRADA" 
        ? validatedData.quantity 
        : -validatedData.quantity

      await tx.product.update({
        where: { id: validatedData.productId },
        data: {
          currentStock: currentProduct.currentStock + stockChange,
        },
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