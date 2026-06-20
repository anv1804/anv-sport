'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageModal } from './PageModal'
import { deletePage } from './actions'
import { useConfirm, useAlert } from '@/components/providers/ConfirmProvider'

type Page = {
  id: string
  title: string
  slug: string
  content: string
  status: string
  type: string
  createdAt: Date
  updatedAt: Date
}

export function PagesClient({ initialPages }: { initialPages: any[] }) {
  const confirm = useConfirm()
  const alert = useAlert()
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<Page | undefined>(undefined)

  const handleAdd = () => {
    setSelectedPage(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (page: Page) => {
    setSelectedPage(page)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa Trang này?')
    if (!ok) return
    const res = await deletePage(id)
    if (res.success) {
      setPages(prev => prev.filter(p => p.id !== id))
    } else {
      await alert(res.error || 'Lỗi khi xóa trang')
    }
  }

  const handleSaved = (savedPage: Page) => {
    setPages(prev => {
      const exists = prev.find(p => p.id === savedPage.id)
      if (exists) {
        return prev.map(p => p.id === savedPage.id ? savedPage : p)
      }
      return [savedPage, ...prev]
    })
  }

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            className="pl-11"
            placeholder="Tìm kiếm trang..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Button onClick={handleAdd} variant="success" className="w-full sm:w-auto flex items-center gap-2">
          <Plus className="w-5 h-5" /> Thêm Trang mới
        </Button>
      </div>

      <div className="bg-white overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Tiêu đề Trang</th>
              <th className="px-6 py-4">Đường dẫn (Slug)</th>
              <th className="px-6 py-4 text-center">Phân loại</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Không tìm thấy trang nào.
                </td>
              </tr>
            ) : (
              filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${page.type === 'SYSTEM' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                        <LayoutTemplate className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">{page.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                    {page.slug}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${
                      page.type === 'SYSTEM' 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {page.type === 'SYSTEM' ? 'Hệ thống' : 'Tùy chỉnh'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${
                      page.status === 'PUBLISHED' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {page.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(page)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title={page.type === 'SYSTEM' ? 'Cấu hình trang' : 'Chỉnh sửa'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {(page as any).isDeletable !== false && page.type !== 'SYSTEM' && (
                        <button 
                          onClick={() => handleDelete(page.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        page={selectedPage}
        onSaved={handleSaved}
      />
    </div>
  )
}
