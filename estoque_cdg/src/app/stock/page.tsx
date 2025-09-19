"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  Package, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Tag,
  Box,
  Archive
} from "lucide-react"
import { Navbar } from "../../components/navbar"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Product, Category, calculateInventory } from "../../types/inventory"

export default function StockPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStock, setFilterStock] = useState("all") // all, low, out
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      return
    }
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Simulação de dados de categorias
      const mockCategories: Category[] = [
        {
          id: "1",
          name: "Papelaria",
          description: "Produtos de papel e escritório",
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "2", 
          name: "Material de Limpeza",
          description: "Produtos para limpeza e higiene",
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "3",
          name: "Eletrônicos",
          description: "Equipamentos e acessórios eletrônicos",
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        }
      ]

      // Simulação de produtos com diferentes níveis de estoque
      const mockProducts: Product[] = [
        {
          id: "1",
          name: "Papel A4 Chamex",
          code: "PAP001",
          description: "Papel A4 branco 75g/m²",
          categoryId: "1",
          category: mockCategories[0],
          quantity: 2300,
          price: 25.90,
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "2",
          name: "Detergente Líquido",
          code: "LMP001", 
          description: "Detergente neutro 500ml",
          categoryId: "2",
          category: mockCategories[1],
          quantity: 5, // Estoque baixo
          price: 3.50,
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "3",
          name: "Mouse Óptico USB",
          code: "ELE001",
          description: "Mouse óptico com fio USB",
          categoryId: "3",
          category: mockCategories[2],
          quantity: 15,
          price: 29.90,
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "4",
          name: "Caneta Esferográfica Azul",
          code: "PAP002",
          description: "Caneta esferográfica ponta média",
          categoryId: "1",
          category: mockCategories[0],
          quantity: 0, // Sem estoque
          price: 1.50,
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        }
      ]

      setCategories(mockCategories)
      setProducts(mockProducts)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para determinar status do estoque (simplificada)
  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { status: 'out', label: 'Sem Estoque', color: 'text-red-600' }
    }
    
    // Considera estoque baixo quando há menos de 10 unidades
    if (quantity <= 10) {
      return { status: 'low', label: 'Estoque Baixo', color: 'text-yellow-600' }
    }
    
    return { status: 'good', label: 'Estoque OK', color: 'text-green-600' }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === "all" || product.categoryId === filterCategory
    
    const stockStatus = getStockStatus(product.quantity).status
    const matchesStock = 
      filterStock === "all" || 
      (filterStock === "low" && stockStatus === "low") ||
      (filterStock === "out" && stockStatus === "out")
    
    return matchesSearch && matchesCategory && matchesStock
  })

  // Estatísticas gerais
  const stats = {
    totalProducts: products.length,
    outOfStock: products.filter(p => p.quantity === 0).length,
    lowStock: products.filter(p => {
      const { status } = getStockStatus(p.quantity)
      return status === "low"
    }).length,
    totalValue: products.reduce((acc, p) => acc + (p.quantity * p.price), 0)
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Estoque</h1>
              <p className="mt-1 text-sm text-gray-600">Visão geral do estoque atual</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Archive className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalProducts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Sem Estoque</p>
                    <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingDown className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
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
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <Tag className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={filterStock} onValueChange={setFilterStock}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Estoque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os produtos</SelectItem>
                      <SelectItem value="low">Estoque baixo</SelectItem>
                      <SelectItem value="out">Sem estoque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Table - Desktop */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Produtos em Estoque</CardTitle>
                <CardDescription>
                  {filteredProducts.length} produto(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Embalagem</TableHead>
                      <TableHead className="text-right">Estoque Atual</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhum produto encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const stockStatus = getStockStatus(product.quantity)
                        const totalValue = product.quantity * product.price
                        
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.code}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {product.category?.name}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-400">-</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold">{product.quantity} un</span>
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {product.price.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              R$ {totalValue.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                stockStatus.status === 'out' ? 'bg-red-100 text-red-800' :
                                stockStatus.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {stockStatus.label}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </CardContent>
              </Card>
            ) : filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-500">Nenhum produto encontrado</p>
                </CardContent>
              </Card>
            ) : (
              filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity)
                const totalValue = product.quantity * product.price
                
                return (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.code}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stockStatus.status === 'out' ? 'bg-red-100 text-red-800' :
                          stockStatus.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {stockStatus.label}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Categoria:</span>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {product.category?.name}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Estoque:</span>
                          <div className="text-right">
                            <span className="font-semibold">{product.quantity} un</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Valor Total:</span>
                          <span className="font-semibold">R$ {totalValue.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}