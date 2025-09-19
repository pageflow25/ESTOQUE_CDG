"use client"

import React, { useState } from 'react'
import { Package, Tag, DollarSign } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Modal } from './ui/modal'
import { Category, Product } from '../types/inventory'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  onSubmit: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function ProductForm({ isOpen, onClose, categories, onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    categoryId: '',
    unitsPerPackage: 1,
    quantity: 0,
    price: 0,
    isActive: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.code || !formData.categoryId) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    onSubmit({
      ...formData,
      category: categories.find(c => c.id === formData.categoryId)
    })

    // Reset form
    setFormData({
      name: '',
      code: '',
      description: '',
      categoryId: '',
      unitsPerPackage: 1,
      quantity: 0,
      price: 0,
      isActive: true
    })

    onClose()
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Produto" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Produto *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Papel A4 Chamex"
              required
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="Ex: PAP001"
              required
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <Input
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descrição detalhada do produto"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <Select value={formData.categoryId} onValueChange={(value) => handleChange('categoryId', value)}>
              <SelectTrigger>
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unidades por Embalagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidades por Embalagem
            </label>
            <Input
              type="number"
              min="1"
              value={formData.unitsPerPackage}
              onChange={(e) => handleChange('unitsPerPackage', parseInt(e.target.value) || 1)}
              placeholder="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deixe 1 para produtos vendidos individualmente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantidade Inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade Inicial
            </label>
            <Input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Quantidade total em unidades
            </p>
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço Unitário *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        {/* Preview das informações */}
        {formData.name && formData.unitsPerPackage > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Preview da Embalagem</h4>
            <p className="text-sm text-blue-700">
              Produto: <strong>{formData.name}</strong><br/>
              Embalagem: <strong>{formData.unitsPerPackage} unidades por embalagem</strong><br/>
              {formData.quantity > 0 && (
                <>
                  Estoque: <strong>{Math.floor(formData.quantity / formData.unitsPerPackage)} embalagens + {formData.quantity % formData.unitsPerPackage} unidades</strong>
                </>
              )}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Produto ativo
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            <Package className="h-4 w-4 mr-2" />
            Criar Produto
          </Button>
        </div>
      </form>
    </Modal>
  )
}