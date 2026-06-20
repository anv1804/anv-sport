'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Save, Loader2 } from 'lucide-react'
import { createZone, updateZone } from './actions'

type ZoneModalProps = {
  isOpen: boolean
  onClose: () => void
  zone?: any
  onSaved: (zone: any) => void
  pages: any[]
}

export function ZoneModal({ isOpen, onClose, zone, onSaved, pages }: ZoneModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [pageId, setPageId] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptedSave, setAttemptedSave] = useState(false)

  // Auto generate slug from name
  useEffect(() => {
    if (!zone && name && !attemptedSave) {
      setSlug(
        name.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      )
    }
  }, [name, zone, attemptedSave])

  useEffect(() => {
    if (isOpen) {
      if (zone) {
        setName(zone.name)
        setSlug(zone.slug)
        setPageId(zone.pageId || '')
        setDescription(zone.description || '')
        setIsActive(zone.isActive)
      } else {
        setName('')
        setSlug('')
        setPageId('')
        setDescription('')
        setIsActive(true)
      }
      setError(null)
      setAttemptedSave(false)
    }
  }, [isOpen, zone])

  const handleSave = async () => {
    setAttemptedSave(true)
    setError(null)

    if (!name.trim() || !slug.trim()) {
      setError('Vui lòng nhập đầy đủ các thông tin bắt buộc.')
      return
    }

    setLoading(true)
    const data = { name, slug, description, isActive, pageId: pageId || null }
    
    let res;
    if (zone) {
      res = await updateZone(zone.id, data)
    } else {
      res = await createZone(data)
    }

    setLoading(false)

    if (res.success) {
      onSaved(res.data)
      onClose()
    } else {
      setError(res.error || 'Có lỗi xảy ra')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={zone ? 'Chỉnh sửa Khu vực' : 'Thêm Khu vực mới'}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div>
          <Label required>Tên Khu Vực</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Tin nổi bật"
            required
            error={attemptedSave && !name.trim()}
          />
          {attemptedSave && !name.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập tên khu vực</p>}
        </div>

        <div>
          <Label required>Đường dẫn (Slug)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="vd: tin-noi-bat"
            required
            error={attemptedSave && !slug.trim()}
          />
          {attemptedSave && !slug.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập đường dẫn</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            Gắn vào Trang (Tùy chọn)
          </label>
          <select
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50/50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="">-- Không gắn --</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.slug})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            Mô tả
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-slate-50/50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder="Khu vực này dùng để..."
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-slate-700 cursor-pointer flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Kích hoạt khu vực này
          </label>
        </div>

        <div className="pt-4 flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSave} variant="success" disabled={loading} className="min-w-[120px] flex justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Lưu</>}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
