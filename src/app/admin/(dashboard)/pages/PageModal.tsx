'use client'

import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { CategorySearchSelect } from '@/components/ui/CategorySearchSelect'
import { Save, Loader2, Pin } from 'lucide-react'
import { createPage, updatePage } from './actions'
import { getZones } from '../zones/actions'
import { getAds } from '../ads/actions'
import { getCategories } from '../categories/actions'
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesProvider'
import { PageSystemDesigner } from './PageSystemDesigner'

type PageModalProps = {
  isOpen: boolean
  onClose: () => void
  page?: any
  onSaved: (page: any) => void
}

export function PageModal({ isOpen, onClose, page, onSaved }: PageModalProps) {
  const { setDirty, isDirty } = useUnsavedChanges()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [settings, setSettings] = useState('')
  const [status, setStatus] = useState('PUBLISHED')
  const [type, setType] = useState('CUSTOM')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptedSave, setAttemptedSave] = useState(false)
  const [availableZones, setAvailableZones] = useState<any[]>([])
  const [availableAds, setAvailableAds] = useState<any[]>([])
  const [availableCategories, setAvailableCategories] = useState<any[]>([])

  const filteredZones = useMemo(() => {
    return availableZones.filter(z => z.isActive && (page ? z.pageId === page.id : !z.pageId));
  }, [availableZones, page]);

  const setSettingsWithDirty = (val: string) => {
    setSettings(val)
    setDirty(true)
  }

  // Auto generate slug from title (only for CUSTOM pages)
  useEffect(() => {
    if (!page && title && !attemptedSave && type !== 'SYSTEM') {
      setSlug(
        title.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      )
    }
  }, [title, page, attemptedSave, type])

  useEffect(() => {
    if (isOpen) {
      if (page) {
        setTitle(page.title)
        setSlug(page.slug)
        setContent(page.content || '')
        setSettings(page.settings || '{\n  \n}')
        setStatus(page.status)
        setType(page.type)
      } else {
        setTitle('')
        setSlug('')
        setContent('')
        setSettings('{\n  \n}')
        setStatus('PUBLISHED')
        setType('CUSTOM')
      }
      setError(null)
      setAttemptedSave(false)
      setDirty(false)

      if (page?.type === 'SYSTEM' || !page) {
        getZones().then(res => {
          if (res.success && res.data) setAvailableZones(res.data)
        })
        getAds().then(res => {
          if (res.success && res.data) setAvailableAds(res.data)
        })
        getCategories().then(cats => {
          if (Array.isArray(cats)) setAvailableCategories(cats)
        })
      }
    }
  }, [isOpen, page])

  const handleSlotChange = (slotKey: string, zoneId: string) => {
    try {
      const current = JSON.parse(settings || '{}');
      if (zoneId) {
        current[slotKey] = zoneId;
      } else {
        delete current[slotKey];
      }
      setSettings(JSON.stringify(current, null, 2));
      setDirty(true);
    } catch (e) {
      const current = { [slotKey]: zoneId };
      setSettings(JSON.stringify(current, null, 2));
      setDirty(true);
    }
  }

  const handleSave = async () => {
    setAttemptedSave(true)
    setError(null)

    if (!title.trim() || !slug.trim()) {
      setError('Vui lòng nhập đầy đủ các thông tin bắt buộc.')
      return
    }

    if (type === 'SYSTEM') {
      try {
        JSON.parse(settings || '{}')
      } catch (e) {
        setError('Cấu hình JSON không hợp lệ.')
        return
      }
    }

    setLoading(true)
    const data = { title, slug, content, settings, status, type }
    
    let res;
    if (page) {
      res = await updatePage(page.id, data)
    } else {
      res = await createPage(data)
    }

    setLoading(false)

    if (res.success) {
      setDirty(false)
      onSaved(res.data)
      onClose()
    } else {
      setError(res.error || 'Có lỗi xảy ra')
    }
  }

  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmModal(true);
      return;
    }
    setDirty(false);
    onClose();
  }

  const confirmClose = () => {
    setShowConfirmModal(false);
    setDirty(false);
    onClose();
  }

  const isSystem = type === 'SYSTEM'

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={page ? (isSystem ? 'Cấu hình Trang Hệ Thống' : 'Chỉnh sửa Trang') : 'Thêm Trang mới'}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>{isSystem ? "Tên Hệ Thống" : "Tiêu đề Trang"}</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              placeholder="VD: Về chúng tôi"
              required
              error={attemptedSave && !title.trim()}
            />
            {attemptedSave && !title.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập tiêu đề trang</p>}
          </div>

          <div>
            <Label required>Đường dẫn (Slug)</Label>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setDirty(true); }}
              placeholder="vd: ve-chung-toi"
              required
              disabled={isSystem}
              error={attemptedSave && !slug.trim()}
            />
            {attemptedSave && !slug.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập đường dẫn</p>}
          </div>
        </div>

        {isSystem && slug === '/' ? (
          <PageSystemDesigner 
            settings={settings}
            setSettingsWithDirty={setSettingsWithDirty}
            availableZones={availableZones}
            availableAds={availableAds}
            availableCategories={availableCategories}
            filteredZones={filteredZones}
          />
        ) : isSystem ? (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Thành phần cấu hình (JSON Settings)
            </label>
            <div className="text-xs text-slate-400 mb-2">
              Sử dụng JSON để cấu hình các module, zone, layout hiển thị trên trang này.
            </div>
            <textarea
              rows={12}
              value={settings}
              onChange={(e) => { setSettings(e.target.value); setDirty(true); }}
              className="w-full rounded-xl px-4 py-3 bg-slate-800 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm leading-relaxed"
              placeholder="{}"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Nội dung Trang (HTML)
            </label>
            <textarea
              rows={12}
              value={content}
              onChange={(e) => { setContent(e.target.value); setDirty(true); }}
              className="w-full rounded-xl px-4 py-3 bg-slate-50/50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm"
              placeholder="<h1>Giới thiệu về chúng tôi</h1>..."
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Trạng thái hiển thị
          </label>
          <select 
            value={status}
            onChange={e => { setStatus(e.target.value); setDirty(true); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none"
          >
            <option value="PUBLISHED">Đã xuất bản (Hoạt động)</option>
            <option value="DRAFT">Bản nháp (Tạm ẩn)</option>
          </select>
        </div>

        <div className="pt-4 flex gap-3 justify-end border-t border-slate-100">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSave} variant="success" disabled={loading} className="min-w-[120px] flex justify-center">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Lưu cấu hình</>}
          </Button>
        </div>
      </div>
    </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Cảnh báo thay đổi chưa lưu"
        maxWidth="md"
      >
        <div className="space-y-6">
          <p className="text-slate-600">
            Bạn đang có những thay đổi chưa được lưu. Nếu bạn đóng hộp thoại bây giờ, những thay đổi này sẽ bị mất. Bạn có chắc chắn muốn thoát không?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowConfirmModal(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Tiếp tục chỉnh sửa
            </button>
            <button
              onClick={confirmClose}
              className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors"
            >
              Vẫn thoát và Hủy thay đổi
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
