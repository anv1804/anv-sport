'use client'

import { useState, useMemo } from 'react'
import { Category, CategoryFormData } from '@/types/category'
import { createCategory, updateCategory, deleteCategory } from '@/app/admin/(dashboard)/categories/actions'
import { CategoryToolbar } from './CategoryToolbar'
import { CategoryTable } from './CategoryTable'
import { CategoryModal } from './CategoryModal'
import { useConfirm, useAlert } from '@/components/providers/ConfirmProvider'

export function CategoryContainer({ initialCategories }: { initialCategories: Category[] }) {
  const confirm = useConfirm()
  const alert = useAlert()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    isActive: true
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Build hierarchy and flatten
  const flattenedCategories = useMemo(() => {
    const map = new Map<string, any>()
    const roots: any[] = []

    categories.forEach(cat => {
      map.set(cat.id, { ...cat, children: [] })
    })

    categories.forEach(cat => {
      if (cat.parentId) {
        const parent = map.get(cat.parentId)
        if (parent) {
          parent.children.push(map.get(cat.id))
        } else {
          roots.push(map.get(cat.id))
        }
      } else {
        roots.push(map.get(cat.id))
      }
    })

    const result: (Category & { depth: number })[] = []
    
    const flatten = (nodes: any[], depth = 0) => {
      nodes.forEach(node => {
        result.push({ ...node, depth })
        if (node.children) {
          flatten(node.children, depth + 1)
        }
      })
    }
    
    flatten(roots)
    return result
  }, [categories])

  // Apply filters
  const filteredCategories = useMemo(() => {
    return flattenedCategories.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' ? true :
                            statusFilter === 'ACTIVE' ? cat.isActive :
                            !cat.isActive
                            
      return matchesSearch && matchesStatus
    })
  }, [flattenedCategories, searchQuery, statusFilter])

  const getValidParents = () => {
    if (!editingId) return categories
    const descendants = new Set<string>()
    const findDescendants = (id: string) => {
      categories.filter(c => c.parentId === id).forEach(child => {
        descendants.add(child.id)
        findDescendants(child.id)
      })
    }
    findDescendants(editingId)
    return categories.filter(c => c.id !== editingId && !descendants.has(c.id))
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: '', slug: '', description: '', parentId: '', isActive: true })
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingId(cat.id)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parentId: cat.parentId || '',
      isActive: cat.isActive
    })
    setError('')
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)

  const handleDelete = async (id: string) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa danh mục này? Các danh mục con sẽ được chuyển lên cấp cao nhất.')
    if (!ok) return
    
    const res = await deleteCategory(id)
    if (res.success) {
      setCategories(prev => {
        const filtered = prev.filter(c => c.id !== id)
        return filtered.map(c => c.parentId === id ? { ...c, parentId: null } : c)
      })
    } else {
      await alert(res.error || 'Lỗi khi xóa danh mục')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      parentId: formData.parentId || undefined,
      isActive: formData.isActive
    }

    const res = editingId 
      ? await updateCategory(editingId, payload)
      : await createCategory(payload)

    if (res.success && res.data) {
      if (editingId) {
        setCategories(prev => prev.map(c => c.id === editingId ? res.data as Category : c))
      } else {
        setCategories(prev => [...prev, res.data as Category])
      }
      closeModal()
    } else {
      setError(res.error || 'Có lỗi xảy ra')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <CategoryToolbar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onAddClick={openAddModal}
      />

      <CategoryTable 
        categories={filteredCategories}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <CategoryModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        validParents={getValidParents()}
      />
    </div>
  )
}
