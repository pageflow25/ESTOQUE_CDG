"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Package, Plus, Search, Edit, Trash2, Tag, Box } from "lucide-react"
import { Navbar } from "../../components/navbar"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Product, Category, calculateInventory } from "../../types/inventory"

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
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

      // Simulação de dados de produtos com embalagens
      const mockProducts: Product[] = [
        {
          id: "1",
          name: "Papel A4 Chamex",
          code: "PAP001",
          description: "Papel A4 branco 75g/m²",
          categoryId: "1",
          category: mockCategories[0],
          unitsPerPackage: 500, // 500 folhas por resma
          quantity: 2300, // Total de folhas no estoque
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
          unitsPerPackage: 12, // 12 unidades por caixa
          quantity: 87, // Total de unidades no estoque
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
          unitsPerPackage: 1, // Vendido individualmente
          quantity: 15,
          price: 29.90,
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === "all" || product.categoryId === filterCategory
    
    return matchesSearch && matchesCategory
  })

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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Produtos</h1>
              <p className="mt-1 text-sm text-gray-600">Gerencie os produtos do estoque</p>
            </div>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, código ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <Tag className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar categoria" />
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
              </div>
            </CardContent>
          </Card>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Produtos</CardTitle>
                <CardDescription>
                  {filteredProducts.length} produto(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Embalagem</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Nenhum produto encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const inventory = calculateInventory(product.quantity, product.unitsPerPackage)
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.code}</TableCell>
                            <TableCell>{product.name}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {product.category?.name}
                              </span>
                            </TableCell>
                            <TableCell>
                              {product.unitsPerPackage > 1 ? (
                                <span className="text-sm text-gray-600">
                                  {product.unitsPerPackage} un/emb
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">Individual</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.unitsPerPackage > 1 ? (
                                <div className="text-sm">
                                  <div className="font-semibold">
                                    {inventory.packages} emb + {inventory.remainingUnits} un
                                  </div>
                                  <div className="text-gray-500">
                                    ({inventory.totalUnits} total)
                                  </div>
                                </div>
                              ) : (
                                <span className="font-semibold">{product.quantity} un</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              R$ {product.price.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                product.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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

          {/* Mobile Card View */}
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
                const inventory = calculateInventory(product.quantity, product.unitsPerPackage)
                return (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">{product.code}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Categoria:</span>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {product.category?.name}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Embalagem:</span>
                          <span className="font-medium">
                            {product.unitsPerPackage > 1 ? 
                              `${product.unitsPerPackage} un/emb` : 
                              'Individual'
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Estoque:</span>
                          <div className="text-right">
                            {product.unitsPerPackage > 1 ? (
                              <>
                                <div className="font-semibold">
                                  {inventory.packages} emb + {inventory.remainingUnits} un
                                </div>
                                <div className="text-xs text-gray-500">
                                  ({inventory.totalUnits} total)
                                </div>
                              </>
                            ) : (
                              <span className="font-semibold">{product.quantity} un</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Preço:</span>
                          <span className="font-medium">R$ {product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
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