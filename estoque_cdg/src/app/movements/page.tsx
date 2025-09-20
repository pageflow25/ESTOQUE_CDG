"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ArrowUpDown, Plus, Search, Filter, TrendingUp, TrendingDown, Package, Box } from "lucide-react"
import { Navbar } from "../../components/navbar"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Movement, Product, calculateInventory, calculateTotalUnits } from "../../types/inventory"
import { MovementForm } from "../../components/movement-form"

export default function MovementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showMovementForm, setShowMovementForm] = useState(false)

  useEffect(() => {
    if (status === "loading") {
      return
    }
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      // Buscar produtos
      const productsResponse = await fetch('/api/products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData)
      }

      // Buscar movimentações
      const movementsResponse = await fetch('/api/movements')
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json()
        // Converter formato da API para o formato do frontend
        const formattedMovements = movementsData.map((mov: any) => ({
          ...mov,
          type: mov.type.toLowerCase() as "entrada" | "saida", // ENTRADA -> entrada
          date: new Date(mov.date).toISOString().split('T')[0] // formato yyyy-mm-dd
        }))
        setMovements(formattedMovements)
      }
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.product?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.user.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === "all" || movement.type === filterType
    
    return matchesSearch && matchesFilter
  })

  const totalEntradas = movements.filter(m => m.type === "entrada").reduce((acc, m) => acc + m.totalUnits, 0)
  const totalSaidas = movements.filter(m => m.type === "saida").reduce((acc, m) => acc + m.totalUnits, 0)

  const handleCreateMovement = async (movementData: {
    productId: string
    type: "entrada" | "saida"
    packageQuantity: number
    unitQuantity: number
    totalUnits: number
    unitsPerPackage: number
    packageType?: string
    reason: string
    notes?: string
  }) => {
    try {
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...movementData,
          type: movementData.type.toUpperCase(), // entrada -> ENTRADA
          user: session?.user?.name || 'Usuário Atual',
        })
      })

      if (response.ok) {
        const newMovement = await response.json()
        // Converter de volta para o formato do frontend
        const formattedMovement = {
          ...newMovement,
          type: newMovement.type.toLowerCase() as "entrada" | "saida",
          date: new Date(newMovement.date).toISOString().split('T')[0]
        }
        
        setMovements(prev => [formattedMovement, ...prev])
        
        // Atualizar lista de produtos para refletir mudança no estoque
        const updatedProduct = newMovement.product
        setProducts(prev => prev.map(p => 
          p.id === updatedProduct.id ? updatedProduct : p
        ))
        
        setShowMovementForm(false)
        console.log('Movimentação criada:', formattedMovement)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar movimentação')
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
      alert('Erro de conexão')
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Movimentações</h1>
              <p className="mt-1 text-sm text-gray-600">Controle de entrada e saída de produtos</p>
            </div>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => setShowMovementForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Entradas</p>
                    <p className="text-2xl font-bold text-green-600">{totalEntradas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Saídas</p>
                    <p className="text-2xl font-bold text-red-600">{totalSaidas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowUpDown className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Saldo</p>
                    <p className="text-2xl font-bold text-blue-600">{totalEntradas - totalSaidas}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por produto, código ou usuário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movements List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </CardContent>
              </Card>
            ) : filteredMovements.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma movimentação encontrada</h3>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Não há movimentações que correspondam aos filtros aplicados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredMovements.map((movement) => (
                <Card key={movement.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          movement.type === "entrada" 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {movement.type === "entrada" ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : (
                            <TrendingDown className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {movement.product?.name}
                          </h3>
                          <p className="text-sm text-gray-600">{movement.product?.code}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                        <div className="text-sm">
                          <span className="text-gray-600">Movimento: </span>
                          <div className={`font-semibold ${
                            movement.type === "entrada" ? "text-green-600" : "text-red-600"
                          }`}>
                            {movement.type === "entrada" ? "+" : "-"}
                            {movement.unitsPerPackage && movement.unitsPerPackage > 1 ? (
                              <>
                                <div>{movement.packageQuantity} {movement.product?.packageType || 'emb'} + {movement.unitQuantity} un</div>
                                <div className="text-xs opacity-75">({movement.totalUnits} total)</div>
                              </>
                            ) : (
                              <span>{movement.totalUnits} un</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{movement.user}</p>
                          <p>{new Date(movement.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Motivo: </span>
                          <span className="font-medium">{movement.reason}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Movement Form */}
          {showMovementForm && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Nova Movimentação</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowMovementForm(false)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="p-4">
                  <MovementForm 
                    products={products} 
                    onSubmit={(data) => {
                      handleCreateMovement(data)
                      setShowMovementForm(false)
                    }} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}