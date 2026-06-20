import { X, Plus, Edit2, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Category, CategoryFormData } from '@/types/category'

type CategoryModalProps = {
  isOpen: boolean
  onClose: () => void
  editingId: string | null
  formData: CategoryFormData
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>
  loading: boolean
  error: string
  onSubmit: (e: React.FormEvent) => void
  validParents: Category[]
}

export function CategoryModal({
  isOpen,
  onClose,
  editingId,
  formData,
  setFormData,
  loading,
  error,
  onSubmit,
  validParents
}: CategoryModalProps) {
  if (!isOpen) return null

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || !editingId 
        ? name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        : prev.slug
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {editingId ? <Edit2 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
            {editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label required>Tên danh mục</Label>
              <Input
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="VD: Thể thao"
              />
            </div>

            <div>
              <Label required>Đường dẫn (Slug)</Label>
              <Input
                required
                value={formData.slug}
                onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                className="font-mono text-sm"
                placeholder="vd: the-thao"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Danh mục cha</label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData(p => ({ ...p, parentId: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 bg-slate-50/50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-medium appearance-none cursor-pointer"
              >
                <option value="">-- Trống (Cấp cao nhất) --</option>
                {validParents.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Mô tả</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl px-4 py-3 bg-slate-50/50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Mô tả ngắn gọn về danh mục..."
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 mt-2">
              <div>
                <p className="font-bold text-slate-800 text-sm">Trạng thái hoạt động</p>
                <p className="text-xs text-slate-500 mt-0.5">Hiển thị danh mục này trên website</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 font-bold text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4 md:mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="success"
                isLoading={loading}
                className="flex-1"
              >
                {editingId ? 'Cập nhật' : 'Thêm danh mục'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
