"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Package, Calculator } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Product, calculateTotalUnits, calculateInventory } from '../types/inventory'

interface MovementFormProps {
  products: Product[]
  onSubmit: (movement: {
    productId: string
    type: "entrada" | "saida"
    packageQuantity: number
    unitsPerPackage: number
    unitQuantity: number
    totalUnits: number
    reason: string
    notes?: string
  }) => void
}

export function MovementForm({ products, onSubmit }: MovementFormProps) {
  const [selectedProductId, setSelectedProductId] = useState("")
  const [movementType, setMovementType] = useState<"entrada" | "saida">("entrada")
  const [packageQuantity, setPackageQuantity] = useState(0)
  const [unitsPerPackage, setUnitsPerPackage] = useState(1)
  const [unitQuantity, setUnitQuantity] = useState(0)
  // packageType é fixo no Product; não mantemos no formulário de movimentação
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const totalUnits = calculateTotalUnits(packageQuantity, unitQuantity, unitsPerPackage)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProductId || !reason) {
      return
    }

    onSubmit({
      productId: selectedProductId,
      type: movementType,
      packageQuantity,
      unitsPerPackage,
      unitQuantity,
      totalUnits,
      // packageType não é enviado, é propriedade do produto
      reason,
      notes: notes || undefined
    })

    // Reset form
    setSelectedProductId("")
    setPackageQuantity(0)
    setUnitsPerPackage(1)
    setUnitQuantity(0)
    // packageType não armazenado no formulário
    setReason("")
    setNotes("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nova Movimentação
        </CardTitle>
        <CardDescription>
          Registre entradas e saídas de produtos do estoque
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produto
              </label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <Package className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Selecionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Movimento
              </label>
              <Select value={movementType} onValueChange={(value) => setMovementType(value as "entrada" | "saida")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Configuração da Embalagem (produto define tipo fixo) */}
          {selectedProduct && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Configuração da Embalagem</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Embalagem (do produto)
                  </label>
                  <div className="px-3 py-2 border rounded-md bg-gray-50">{selectedProduct.packageType || 'Unidade'}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidades por Embalagem (para esta movimentação)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={unitsPerPackage}
                    onChange={(e) => setUnitsPerPackage(parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantas unidades vêm em cada {selectedProduct.packageType || 'embalagem'} (pode variar por movimentação)
                  </p>
                </div>

                <div className="flex items-end">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 w-full">
                    <p className="text-sm text-gray-600 mb-1">Exemplo:</p>
                    <p className="font-medium text-gray-900">
                      1 {selectedProduct.packageType || 'embalagem'} = {unitsPerPackage} unidade(s)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Informações do produto selecionado */}
          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Informações do Produto</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Categoria:</span>
                  <p className="font-medium">{selectedProduct.category?.name}</p>
                </div>
                <div>
                  <span className="text-blue-700">Estoque Atual:</span>
                  <p className="font-medium">{selectedProduct.quantity} unidades</p>
                </div>
                <div>
                  <span className="text-blue-700">Preço:</span>
                  <p className="font-medium">R$ {selectedProduct.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quantidades */}
          {selectedProduct && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Quantidades</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Embalagens */}
                {unitsPerPackage > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade de {selectedProduct?.packageType || 'Embalagens'}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={packageQuantity}
                      onChange={(e) => setPackageQuantity(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                )}

                {/* Unidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {unitsPerPackage > 1 
                      ? 'Unidades Avulsas'
                      : 'Quantidade Total'
                    }
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={unitQuantity}
                    onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Cálculo Total */}
              {totalUnits > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">Cálculo Total</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {unitsPerPackage > 1 ? (
                      <>
                        <p>
                          {packageQuantity} {selectedProduct?.packageType || 'embalagens'} × {unitsPerPackage} un/emb = {packageQuantity * unitsPerPackage} un
                        </p>
                        <p>+ {unitQuantity} unidades avulsas</p>
                        <div className="border-t border-gray-300 mt-2 pt-2">
                          <p className="font-semibold text-gray-900">
                            Total: {totalUnits} unidades
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="font-semibold text-gray-900">
                        Total: {totalUnits} unidades
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo *
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar motivo" />
              </SelectTrigger>
              <SelectContent>
                {movementType === "entrada" ? (
                  <>
                    <SelectItem value="compra">Compra</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                    <SelectItem value="ajuste_positivo">Ajuste Positivo</SelectItem>
                    <SelectItem value="producao">Produção</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="uso_interno">Uso Interno</SelectItem>
                    <SelectItem value="ajuste_negativo">Ajuste Negativo</SelectItem>
                    <SelectItem value="perda">Perda/Avaria</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais (opcional)"
            />
          </div>

          {/* Botão Submit */}
          <Button 
            type="submit" 
            className="w-full"
            disabled={!selectedProductId || !reason || totalUnits === 0}
          >
            Registrar Movimentação
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}