import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { SiteHeaderSettings } from '@/types/settings'
import { updateSetting } from '@/app/admin/(dashboard)/settings/actions'
import { Save, CheckCircle2, XCircle } from 'lucide-react'

type Props = {
  initialData: SiteHeaderSettings
  onSuccess?: () => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function HeaderSettings({ initialData, onSuccess, onDirtyChange }: Props) {
  const [data, setData] = useState<SiteHeaderSettings>(initialData)
  const [savedData, setSavedData] = useState<SiteHeaderSettings>(initialData)
  const [loading, setLoading] = useState(false)
  const [attemptedSave, setAttemptedSave] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(JSON.stringify(data) !== JSON.stringify(savedData))
    }
  }, [data, savedData, onDirtyChange])

  const handleSave = async () => {
    setAttemptedSave(true)
    setMessage(null)

    if (!data.logoUrl?.trim() || !data.siteName?.trim() || !data.contactEmail?.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' })
      setTimeout(() => {
        const el = document.querySelector('.border-red-300');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return
    }

    setLoading(true)
    const res = await updateSetting('SITE_HEADER', JSON.stringify(data))
    if (res.success) {
      setSavedData(data)
      if (onDirtyChange) onDirtyChange(false)
      setMessage({ type: 'success', text: 'Đã lưu cấu hình Header thành công!' })
      if (onSuccess) {
        setTimeout(onSuccess, 1000) // Close modal after 1s
      }
    } else {
      setMessage({ type: 'error', text: res.error || 'Có lỗi xảy ra' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label required>Đường dẫn Logo (URL)</Label>
          <Input
            value={data.logoUrl}
            onChange={e => setData({...data, logoUrl: e.target.value})}
            placeholder="https://example.com/logo.png"
            required
            error={attemptedSave && !data.logoUrl?.trim()}
          />
          {attemptedSave && !data.logoUrl?.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập đường dẫn Logo</p>}
        </div>

        <div>
          <Label required>Tên Website (Site Name)</Label>
          <Input
            value={data.siteName}
            onChange={e => setData({...data, siteName: e.target.value})}
            placeholder="Ví dụ: ANV Sport"
            required
            error={attemptedSave && !data.siteName?.trim()}
          />
          {attemptedSave && !data.siteName?.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập tên website</p>}
        </div>

        <div>
          <Label required>Email liên hệ</Label>
          <Input
            type="email"
            value={data.contactEmail}
            onChange={e => setData({...data, contactEmail: e.target.value})}
            placeholder="contact@anvsport.com"
            required
            error={attemptedSave && !data.contactEmail?.trim()}
          />
          {attemptedSave && !data.contactEmail?.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập email liên hệ</p>}
        </div>

        <div>
          <Label>Số điện thoại liên hệ</Label>
          <Input
            value={data.contactPhone}
            onChange={e => setData({...data, contactPhone: e.target.value})}
            placeholder="0123 456 789"
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <Button onClick={handleSave} isLoading={loading} variant="success" className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Lưu cấu hình
        </Button>
      </div>
    </div>
  )
}
