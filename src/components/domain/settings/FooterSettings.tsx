import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { SiteFooterSettings } from '@/types/settings'
import { updateSetting } from '@/app/admin/(dashboard)/settings/actions'
import { Save, CheckCircle2, XCircle } from 'lucide-react'

type Props = {
  initialData: SiteFooterSettings
  onSuccess?: () => void
  onDirtyChange?: (isDirty: boolean) => void
}

export function FooterSettings({ initialData, onSuccess, onDirtyChange }: Props) {
  const [data, setData] = useState<SiteFooterSettings>(initialData)
  const [savedData, setSavedData] = useState<SiteFooterSettings>(initialData)
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

    if (!data.aboutText?.trim() || !data.copyright?.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' })
      setTimeout(() => {
        const el = document.querySelector('.border-red-300') || document.querySelector('.border-red-400');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return
    }

    setLoading(true)
    const res = await updateSetting('SITE_FOOTER', JSON.stringify(data))
    if (res.success) {
      setSavedData(data)
      if (onDirtyChange) onDirtyChange(false)
      setMessage({ type: 'success', text: 'Đã lưu cấu hình Footer thành công!' })
      if (onSuccess) setTimeout(onSuccess, 1000)
    } else {
      setMessage({ type: 'error', text: res.error || 'Có lỗi xảy ra' })
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
            Đoạn giới thiệu ngắn (About) <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={data.aboutText}
            onChange={(e) => setData({ ...data, aboutText: e.target.value })}
            className={`w-full rounded-xl px-4 py-3 bg-slate-50/50 border ${attemptedSave && !data.aboutText?.trim() ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'} text-slate-800 focus:outline-none focus:ring-2`}
            placeholder="Viết một đoạn ngắn giới thiệu về website..."
          />
          {attemptedSave && !data.aboutText?.trim() && (
            <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập đoạn giới thiệu</p>
          )}
        </div>

        <div>
          <Label required>Nội dung Bản quyền (Copyright)</Label>
          <Input
            value={data.copyright}
            onChange={e => setData({...data, copyright: e.target.value})}
            placeholder="© 2026 ANV Sport"
            required
            error={attemptedSave && !data.copyright?.trim()}
          />
          {attemptedSave && !data.copyright?.trim() && <p className="mt-1.5 text-xs font-bold text-red-500">Vui lòng nhập nội dung bản quyền</p>}
        </div>

        <div>
          <Label>Link Facebook</Label>
          <Input
            value={data.facebookUrl}
            onChange={e => setData({...data, facebookUrl: e.target.value})}
            placeholder="https://facebook.com/..."
          />
        </div>

        <div>
          <Label>Link Youtube</Label>
          <Input
            value={data.youtubeUrl}
            onChange={e => setData({...data, youtubeUrl: e.target.value})}
            placeholder="https://youtube.com/..."
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
