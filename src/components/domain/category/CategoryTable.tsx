import { Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Category } from '@/types/category'

type FlattenedCategory = Category & { depth: number }

type CategoryTableProps = {
  categories: FlattenedCategory[]
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}

export function CategoryTable({ categories, onEdit, onDelete }: CategoryTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên danh mục</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Bài viết</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người tạo</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                  Không tìm thấy danh mục nào phù hợp.
                </td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div 
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${cat.depth * 1.5}rem` }}
                    >
                      {cat.depth > 0 && <div className="w-3 h-px bg-slate-300 shrink-0"></div>}
                      <span className="font-bold text-slate-800">{cat.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-mono">
                    {cat.slug}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-xs rounded-full min-w-[2rem] px-2 py-1">
                      {cat._count?.posts || 0}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-600">
                    {cat.createdBy}
                  </td>
                  <td className="p-4">
                    {cat.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
                        <XCircle className="w-3.5 h-3.5 shrink-0" /> Đã ẩn
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(cat.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>
    </div>
  )
}
