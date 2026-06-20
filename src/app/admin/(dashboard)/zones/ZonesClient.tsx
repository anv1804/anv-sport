'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Power, Layers } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ZoneModal } from './ZoneModal'
import { deleteZone, toggleZoneStatus } from './actions'

import { Zone } from '@/types/zone'
import { Page } from '@/types/page'
import { useConfirm, useAlert } from '@/components/providers/ConfirmProvider'

export function ZonesClient({ initialZones, pages }: { initialZones: Zone[], pages: Page[] }) {
  const confirm = useConfirm()
  const alert = useAlert()
  const [zones, setZones] = useState<Zone[]>(initialZones)
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedZone, setSelectedZone] = useState<Zone | undefined>(undefined)

  // Handlers
  const handleAdd = () => {
    setSelectedZone(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (zone: Zone) => {
    setSelectedZone(zone)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa Khu vực này?')
    if (!ok) return
    const res = await deleteZone(id)
    if (res.success) {
      setZones(prev => prev.filter(z => z.id !== id))
    } else {
      await alert(res.error || 'Lỗi khi xóa khu vực')
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleZoneStatus(id, !currentStatus)
    if (res.success) {
      setZones(prev => prev.map(z => z.id === id ? { ...z, isActive: !currentStatus } : z))
    } else {
      await alert(res.error || 'Lỗi khi cập nhật trạng thái')
    }
  }

  const handleSaved = (savedZone: Zone) => {
    setZones(prev => {
      if (selectedZone) {
        return prev.map(z => z.id === selectedZone.id ? { ...savedZone, _count: z._count } : z)
      }
      return [{ ...savedZone, _count: { zonePosts: 0 } }, ...prev]
    })
  }

  const filteredZones = zones.filter(z => 
    z.name.toLowerCase().includes(search.toLowerCase()) || 
    z.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input 
            className="pl-11"
            placeholder="Tìm kiếm khu vực..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Button onClick={handleAdd} variant="success" className="w-full sm:w-auto flex items-center gap-2">
          <Plus className="w-5 h-5" /> Thêm Khu Vực
        </Button>
      </div>

      {/* Data Table */}
      <div className="bg-white overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Tên Khu Vực</th>
              <th className="px-6 py-4">Đường dẫn (Slug)</th>
              <th className="px-6 py-4">Mô tả</th>
              <th className="px-6 py-4 text-center">Bài viết</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredZones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  Không tìm thấy khu vực nào.
                </td>
              </tr>
            ) : (
              filteredZones.map((zone) => (
                <tr key={zone.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{zone.name}</span>
                        {zone.page && (
                          <span className="ml-2 inline-block px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium border border-blue-100">
                            {zone.page.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                    {zone.slug}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm max-w-[200px] truncate">
                    {zone.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
                      {zone._count?.zonePosts || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleToggleStatus(zone.id, zone.isActive)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        zone.isActive 
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {zone.isActive ? 'Đang bật' : 'Đã tắt'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(zone)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(zone.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      {isModalOpen && (
        <ZoneModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          zone={selectedZone}
          onSaved={handleSaved}
          pages={pages}
        />
      )}</div>
    </div>
  )
}
