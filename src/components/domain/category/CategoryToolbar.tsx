import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type CategoryToolbarProps = {
  searchQuery: string
  setSearchQuery: (val: string) => void
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
  setStatusFilter: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void
  onAddClick: () => void
}

export function CategoryToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onAddClick
}: CategoryToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm danh mục..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full sm:w-64 transition-all"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium text-slate-600 cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Đang ẩn</option>
        </select>
      </div>

      <Button onClick={onAddClick} variant="success" className="w-full md:w-auto flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" />
        Thêm danh mục
      </Button>
    </div>
  )
}
