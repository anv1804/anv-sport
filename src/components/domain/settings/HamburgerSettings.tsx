'use client'

import { useState, useEffect } from 'react'
import { SiteHamburgerSettings, HamburgerLink } from '@/types/settings'
import { updateSetting } from '@/app/admin/(dashboard)/settings/actions'
import { Plus, Trash2, GripVertical, AlertCircle, Save, CheckCircle2, XCircle } from 'lucide-react'

type Props = {
  initialData: SiteHamburgerSettings
  onSuccess?: () => void
  onDirtyChange?: React.Dispatch<React.SetStateAction<boolean>>
}

export function HamburgerSettings({ initialData, onSuccess, onDirtyChange }: Props) {
  const [utilities, setUtilities] = useState<HamburgerLink[]>(initialData.utilities || [])
  const [apps, setApps] = useState<HamburgerLink[]>(initialData.apps || [])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Track changes to warn user before closing
  useEffect(() => {
    if (!onDirtyChange) return
    const isUtilitiesChanged = JSON.stringify(utilities) !== JSON.stringify(initialData.utilities)
    const isAppsChanged = JSON.stringify(apps) !== JSON.stringify(initialData.apps)
    
    onDirtyChange(isUtilitiesChanged || isAppsChanged)
  }, [utilities, apps, initialData, onDirtyChange])

  const handleUpdateLink = (
    type: 'utilities' | 'apps', 
    id: string, 
    field: keyof HamburgerLink, 
    value: string
  ) => {
    const updater = type === 'utilities' ? setUtilities : setApps;
    updater(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const handleRemoveLink = (type: 'utilities' | 'apps', id: string) => {
    const updater = type === 'utilities' ? setUtilities : setApps;
    updater(prev => prev.filter(item => item.id !== id))
  }

  const handleAddLink = (type: 'utilities' | 'apps') => {
    const updater = type === 'utilities' ? setUtilities : setApps;
    const newId = Math.random().toString(36).substring(2, 9)
    updater(prev => [...prev, { id: newId, label: 'Liên kết mới', url: '#' }])
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setMessage(null)
      const dataToSave: SiteHamburgerSettings = { utilities, apps }
      await updateSetting('SITE_HAMBURGER', JSON.stringify(dataToSave))
      setMessage({ type: 'success', text: 'Lưu cấu hình Hamburger thành công' })
      
      if (onDirtyChange) onDirtyChange(false)
      if (onSuccess) {
        setTimeout(onSuccess, 1000)
      }
    } catch (error) {
      console.error(error)
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu cấu hình' })
    } finally {
      setLoading(false)
    }
  }

  const renderLinkEditor = (type: 'utilities' | 'apps', items: HamburgerLink[], title: string, description: string) => (
    <div className="bg-slate-50/50 p-6 rounded-[20px] border border-slate-200/60 mb-4 md:mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-[16px] font-bold text-slate-800">{title}</h3>
          <p className="text-[13px] text-slate-500 mt-1">{description}</p>
        </div>
        <button
          onClick={() => handleAddLink(type)}
          className="flex items-center text-sm px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Thêm liên kết
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-3 items-start bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm relative group">
            <div className="mt-2.5 text-slate-400 cursor-move">
              <GripVertical className="w-4 h-4" />
            </div>
            
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tên hiển thị</label>
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => handleUpdateLink(type, item.id, 'label', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="VD: Tin nóng"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Đường dẫn (URL)</label>
                <input
                  type="text"
                  value={item.url}
                  onChange={(e) => handleUpdateLink(type, item.id, 'url', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="VD: /tin-nong"
                />
              </div>
            </div>

            <button
              onClick={() => handleRemoveLink(type, item.id)}
              className="mt-4 md:mt-6 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa liên kết"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-4 md:py-6 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400">Chưa có liên kết nào. Nhấn "Thêm liên kết" để tạo mới.</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="flex-1 overflow-y-auto px-6 py-4 md:py-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm">
              <p className="font-bold mb-1">Cấu hình Mega Menu</p>
              <p className="text-blue-700/80">Bạn đang cấu hình các tiện ích và ứng dụng hiển thị bên phía cột phải của menu (Mega Menu).</p>
            </div>
          </div>

          {renderLinkEditor('utilities', utilities, 'Danh sách Tiện ích', 'Các đường dẫn nổi bật như Mới nhất, Xem nhiều, Spotlight...')}
          
          {renderLinkEditor('apps', apps, 'Tải ứng dụng', 'Các đường dẫn ứng dụng hoặc liên kết quan trọng ở góc dưới cùng.')}
          
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto">
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
