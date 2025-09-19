"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { BarChart3, Package, TrendingDown, TrendingUp, FileText, Calendar } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Product {
  id: string
  name: string
  material: string
  format: string
  currentStock: number
  unit: string
  minimumStock: number
}

interface Movement {
  id: string
  productId: string
  type: "ENTRADA" | "SAIDA"
  quantity: number
  unitPrice: number
  totalPrice: number
  reason: string
  date: Date
  product?: Product
}

interface StockReport {
  product: Product
  totalEntries: number
  totalExits: number
  currentStock: number
  stockValue: number
  lastMovement?: Date
  status: "OK" | "LOW" | "OUT"
}

interface MovementSummary {
  totalMovements: number
  totalEntries: number
  totalExits: number
  totalValueIn: number
  totalValueOut: number
  recentMovements: Movement[]
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [stockReport, setStockReport] = useState<StockReport[]>([])
  const [movementSummary, setMovementSummary] = useState<MovementSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      return
    }
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    fetchData()
  }, [status, router])

  const fetchData = async () => {
    try {
      const [productsRes, movementsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/movements")
      ])

      if (productsRes.ok && movementsRes.ok) {
        const productsData = await productsRes.json()
        const movementsData = await movementsRes.json()
        
        setProducts(productsData)
        setMovements(movementsData)
        
        generateReports(productsData, movementsData)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateReports = (products: Product[], movements: Movement[]) => {
    // Generate stock report
    const stockReportData: StockReport[] = products.map(product => {
      const productMovements = movements.filter(m => m.productId === product.id)
      const entries = productMovements.filter(m => m.type === "ENTRADA")
      const exits = productMovements.filter(m => m.type === "SAIDA")
      
      const totalEntries = entries.reduce((sum, m) => sum + m.quantity, 0)
      const totalExits = exits.reduce((sum, m) => sum + m.quantity, 0)
      
      // Estimate stock value based on latest entry prices
      const latestEntry = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      const estimatedUnitPrice = latestEntry?.unitPrice || 0
      const stockValue = product.currentStock * estimatedUnitPrice
      
      const lastMovement = productMovements.length > 0 
        ? new Date(Math.max(...productMovements.map(m => new Date(m.date).getTime())))
        : undefined

      let status: "OK" | "LOW" | "OUT" = "OK"
      if (product.currentStock === 0) {
        status = "OUT"
      } else if (product.currentStock <= product.minimumStock) {
        status = "LOW"
      }

      return {
        product,
        totalEntries,
        totalExits,
        currentStock: product.currentStock,
        stockValue,
        lastMovement,
        status
      }
    })

    // Generate movement summary
    const totalMovements = movements.length
    const totalEntries = movements.filter(m => m.type === "ENTRADA").reduce((sum, m) => sum + m.quantity, 0)
    const totalExits = movements.filter(m => m.type === "SAIDA").reduce((sum, m) => sum + m.quantity, 0)
    const totalValueIn = movements.filter(m => m.type === "ENTRADA").reduce((sum, m) => sum + m.totalPrice, 0)
    const totalValueOut = movements.filter(m => m.type === "SAIDA").reduce((sum, m) => sum + m.totalPrice, 0)
    
    const recentMovements = movements
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    setStockReport(stockReportData)
    setMovementSummary({
      totalMovements,
      totalEntries,
      totalExits,
      totalValueIn,
      totalValueOut,
      recentMovements
    })
  }

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

  const lowStockItems = stockReport.filter(item => item.status === "LOW" || item.status === "OUT")
  const totalStockValue = stockReport.reduce((sum, item) => sum + item.stockValue, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="mt-1 text-sm text-gray-600">
              Visão geral do estoque e movimentações
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Valor Total do Estoque
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(totalStockValue)}</div>
                <p className="text-xs text-muted-foreground">
                  valor estimado do inventário
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Produtos Cadastrados
                </CardTitle>
                <Package className="h-4 w-4 text-green-600 flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">
                  itens no catálogo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Alertas de Estoque
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  produtos com estoque baixo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Total de Movimentações
                </CardTitle>
                <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">{movementSummary?.totalMovements || 0}</div>
                <p className="text-xs text-muted-foreground">
                  registros de entrada/saída
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Movement Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumo de Movimentações
                </CardTitle>
                <CardDescription>
                  Dados consolidados do período
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total de Entradas:</span>
                  <span className="text-green-600 font-bold">
                    {movementSummary?.totalEntries || 0} itens
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total de Saídas:</span>
                  <span className="text-red-600 font-bold">
                    {movementSummary?.totalExits || 0} itens
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor Entrada:</span>
                  <span className="text-green-600 font-bold">
                    {formatCurrency(movementSummary?.totalValueIn || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor Saída:</span>
                  <span className="text-red-600 font-bold">
                    {formatCurrency(movementSummary?.totalValueOut || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Alertas de Estoque
                </CardTitle>
                <CardDescription>
                  Produtos com estoque baixo ou zerado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <p className="text-green-600 text-sm">
                    ✓ Todos os produtos estão com estoque adequado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 5).map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium">{item.product.name}</div>
                          <div className="text-xs text-gray-500">
                            {item.product.material} {item.product.format}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "OUT" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {item.status === "OUT" ? "SEM ESTOQUE" : "ESTOQUE BAIXO"}
                        </span>
                      </div>
                    ))}
                    {lowStockItems.length > 5 && (
                      <p className="text-xs text-gray-500 pt-2">
                        +{lowStockItems.length - 5} outros produtos
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stock Status Report */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Relatório de Estoque</CardTitle>
              <CardDescription>
                Status detalhado de todos os produtos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {/* Mobile Cards View */}
              <div className="block lg:hidden">
                <div className="space-y-4 p-4">
                  {stockReport.map((item) => (
                    <Card key={item.product.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 truncate">{item.product.name}</h3>
                            <p className="text-sm text-gray-500 truncate">
                              {item.product.material} {item.product.format}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === "OK" 
                              ? "bg-green-100 text-green-800"
                              : item.status === "LOW"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {item.status === "OK" ? "OK" : item.status === "LOW" ? "BAIXO" : "SEM ESTOQUE"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Atual:</span>
                            <div className="font-medium">{item.currentStock} {item.product.unit}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Mínimo:</span>
                            <div className="font-medium">{item.product.minimumStock} {item.product.unit}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Entradas:</span>
                            <div className="font-medium text-green-600">+{item.totalEntries}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Saídas:</span>
                            <div className="font-medium text-red-600">-{item.totalExits}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <span className="text-gray-500">Valor Estimado:</span>
                          <span className="ml-1 font-medium">{formatCurrency(item.stockValue)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Estoque Mínimo</TableHead>
                    <TableHead>Total Entradas</TableHead>
                    <TableHead>Total Saídas</TableHead>
                    <TableHead>Valor Estimado</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockReport.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.product.material} {item.product.format}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.currentStock} {item.product.unit}
                      </TableCell>
                      <TableCell>
                        {item.product.minimumStock} {item.product.unit}
                      </TableCell>
                      <TableCell className="text-green-600">
                        +{item.totalEntries}
                      </TableCell>
                      <TableCell className="text-red-600">
                        -{item.totalExits}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.stockValue)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === "OK" 
                            ? "bg-green-100 text-green-800"
                            : item.status === "LOW"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {item.status === "OK" ? "OK" : item.status === "LOW" ? "BAIXO" : "SEM ESTOQUE"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-5 w-5 flex-shrink-0" />
                Movimentações Recentes
              </CardTitle>
              <CardDescription>
                Últimas 5 movimentações registradas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {/* Mobile Cards */}
              <div className="block md:hidden">
                <div className="space-y-4 p-4">
                  {movementSummary?.recentMovements.map((movement) => (
                    <Card key={movement.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{movement.product?.name}</div>
                            <div className="text-sm text-gray-500">{formatDate(movement.date)}</div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            movement.type === "ENTRADA" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {movement.type}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Quantidade:</span>
                            <div className="font-medium">{movement.quantity}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Valor:</span>
                            <div className="font-medium">{formatCurrency(movement.totalPrice)}</div>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Motivo:</span>
                          <span className="ml-1">{movement.reason}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementSummary?.recentMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {formatDate(movement.date)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{movement.product?.name}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          movement.type === "ENTRADA" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {movement.type}
                        </span>
                      </TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{formatCurrency(movement.totalPrice)}</TableCell>
                      <TableCell className="text-sm">{movement.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>

              {!movementSummary?.recentMovements.length && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma movimentação encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}