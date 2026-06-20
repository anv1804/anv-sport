'use client'

import { useState } from 'react'
import { SiteHeaderSettings, SiteFooterSettings, SiteMenuSettings, SiteHamburgerSettings } from '@/types/settings'
import { HeaderSettings } from './HeaderSettings'
import { FooterSettings } from './FooterSettings'
import { MenuSettings } from './MenuSettings'
import { HamburgerSettings } from './HamburgerSettings'
import { Modal } from '@/components/ui/Modal'
import { Edit, History, LayoutPanelTop, PanelBottom, MenuSquare, ArrowRight, Menu as MenuIcon } from 'lucide-react'
import { useUnsavedChanges } from '@/components/providers/UnsavedChangesProvider'
import { useAlert } from '@/components/providers/ConfirmProvider'

type SettingsContainerProps = {
  headerData: SiteHeaderSettings
  footerData: SiteFooterSettings
  menuData: SiteMenuSettings
  hamburgerData: SiteHamburgerSettings
  updatedAtMap: Record<string, Date | null>
  categories: { id: string; name: string; slug: string; parentId: string | null }[]
}

type ModalType = 'HEADER' | 'FOOTER' | 'MENU' | 'HAMBURGER' | null

export function SettingsContainer({ headerData, footerData, menuData, hamburgerData, updatedAtMap, categories }: SettingsContainerProps) {
  const alert = useAlert()
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const { isDirty: hasUnsavedChanges, setDirty: setHasUnsavedChanges } = useUnsavedChanges()
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const rows = [
    {
      id: 'HEADER',
      title: 'Header (Đầu trang)',
      description: 'Cấu hình Logo, Tên website, Thông tin liên hệ',
      icon: LayoutPanelTop,
      color: 'text-blue-500 bg-blue-50',
      updatedAt: updatedAtMap['SITE_HEADER']
    },
    {
      id: 'FOOTER',
      title: 'Footer (Chân trang)',
      description: 'Thông tin giới thiệu, Bản quyền, Mạng xã hội',
      icon: PanelBottom,
      color: 'text-purple-500 bg-purple-50',
      updatedAt: updatedAtMap['SITE_FOOTER']
    },
    {
      id: 'MENU',
      title: 'Menu chính',
      description: 'Quản lý các đường dẫn trên thanh điều hướng',
      icon: MenuSquare,
      color: 'text-orange-500 bg-orange-50',
      updatedAt: updatedAtMap['SITE_MENU']
    },
    {
      id: 'HAMBURGER',
      title: 'Hamburger Menu',
      description: 'Cấu hình các tiện ích mở rộng và app trong menu trượt',
      icon: MenuIcon,
      color: 'text-rose-500 bg-rose-50',
      updatedAt: updatedAtMap['SITE_HAMBURGER']
    }
  ]

  const formatDate = (date: Date | null) => {
    if (!date) return <span className="text-slate-400 italic">Chưa cập nhật</span>
    return new Date(date).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowConfirmModal(true)
      return
    }
    setHasUnsavedChanges(false)
    setActiveModal(null)
  }

  const handleSuccessClose = () => {
    setHasUnsavedChanges(false)
    setActiveModal(null)
  }

  const confirmClose = () => {
    setShowConfirmModal(false)
    setHasUnsavedChanges(false)
    setActiveModal(null)
  }

  const cancelClose = () => {
    setShowConfirmModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-5 px-6">Thành phần</th>
              <th className="py-5 px-6">Thông tin cơ bản</th>
              <th className="py-5 px-6">Lần cập nhật gần nhất</th>
              <th className="py-5 px-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const Icon = row.icon
              return (
                <tr key={row.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${row.color}`}>
                        <Icon className="w-6 h-6" strokeWidth={1.5} />
                      </div>
                      <span className="font-bold text-slate-800 text-[15px]">{row.title}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm text-slate-500 font-medium">{row.description}</td>
                  <td className="py-5 px-6 text-sm text-slate-600 font-medium">{formatDate(row.updatedAt)}</td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => alert('Tính năng Lịch sử cập nhật đang được phát triển!', { type: 'info', title: 'Thông báo' })}
                        className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                        title="Lịch sử cập nhật"
                      >
                        <History className="w-5 h-5" strokeWidth={2} />
                      </button>
                      <button 
                        onClick={() => setActiveModal(row.id as ModalType)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all shadow-sm hover:shadow-md"
                      >
                        <Edit className="w-4 h-4" strokeWidth={2} /> Cấu hình
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>

      <Modal
        isOpen={activeModal === 'HEADER'}
        onClose={handleClose}
        title="Cấu hình Header"
        maxWidth="2xl"
      >
        <HeaderSettings initialData={headerData} onSuccess={handleSuccessClose} onDirtyChange={setHasUnsavedChanges} />
      </Modal>

      <Modal
        isOpen={activeModal === 'FOOTER'}
        onClose={handleClose}
        title="Cấu hình Footer"
        maxWidth="2xl"
      >
        <FooterSettings initialData={footerData} onSuccess={handleSuccessClose} onDirtyChange={setHasUnsavedChanges} />
      </Modal>

      <Modal 
        isOpen={activeModal === 'MENU'} 
        onClose={handleClose} 
        title="Cấu hình Menu chính"
        maxWidth="4xl"
        noScrollBody
      >
        <MenuSettings initialData={menuData} onSuccess={handleSuccessClose} categories={categories} onDirtyChange={setHasUnsavedChanges} />
      </Modal>

      <Modal
        isOpen={activeModal === 'HAMBURGER'}
        onClose={handleClose}
        title="Cấu hình Hamburger Menu"
        maxWidth="4xl"
        noScrollBody
      >
        <HamburgerSettings initialData={hamburgerData} onSuccess={handleSuccessClose} onDirtyChange={setHasUnsavedChanges} />
      </Modal>

      {/* Cảnh báo chưa lưu */}
      <Modal
        isOpen={showConfirmModal}
        onClose={cancelClose}
        title="Cảnh báo thay đổi chưa lưu"
        maxWidth="md"
      >
        <div className="space-y-6">
          <p className="text-slate-600">
            Bạn đang có những thay đổi chưa được lưu. Nếu bạn đóng hộp thoại bây giờ, những thay đổi này sẽ bị mất. Bạn có chắc chắn muốn thoát không?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={cancelClose}
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
    </div>
  )
}
