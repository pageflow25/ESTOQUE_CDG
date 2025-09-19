"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

interface DashboardStats {
  totalProducts: number
  totalEntries: number
  totalExits: number
  lowStockProducts: number
  recentMovements: Array<{
    id: string
    type: "ENTRADA" | "SAIDA"
    quantity: number
    product: {
      name: string
    }
    date: string
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      return
    }
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    // Simulate fetching dashboard data
    const fetchStats = async () => {
      try {
        // You would normally fetch this from your API
        const mockStats: DashboardStats = {
          totalProducts: 45,
          totalEntries: 120,
          totalExits: 98,
          lowStockProducts: 8,
          recentMovements: [
            {
              id: "1",
              type: "ENTRADA",
              quantity: 100,
              product: { name: "Papel A4 Sulfite" },
              date: new Date().toISOString(),
            },
            {
              id: "2",
              type: "SAIDA",
              quantity: 50,
              product: { name: "Tinta Preta HP" },
              date: new Date().toISOString(),
            },
          ]
        }
        setStats(mockStats)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [status, router])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">Carregando...</div>
          </div>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Visão geral do sistema de estoque
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Produtos
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  produtos cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Entradas do Mês
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
                <p className="text-xs text-muted-foreground">
                  movimentações de entrada
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saídas do Mês
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalExits || 0}</div>
                <p className="text-xs text-muted-foreground">
                  movimentações de saída
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Estoque Baixo
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.lowStockProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  produtos com estoque baixo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Recentes</CardTitle>
              <CardDescription>
                Últimas movimentações registradas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentMovements && stats.recentMovements.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-3">
                        {movement.type === "ENTRADA" ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{movement.product.name}</p>
                          <p className="text-xs text-gray-500">
                            {movement.type === "ENTRADA" ? "Entrada" : "Saída"} de {movement.quantity} unidades
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(movement.date).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma movimentação recente</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}