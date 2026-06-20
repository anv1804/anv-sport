'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, MonitorPlay, Settings, FolderTree, LogOut, ChevronLeft, ChevronRight, Layers, LayoutTemplate, PenTool, LayoutList, Users, Shield, Cpu, Database, RefreshCw } from 'lucide-react'

const MENU_ITEMS = [
  { group: 'Quản lý', items: [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Soạn Bài Mới', href: '/admin/posts/new', icon: PenTool },
    { name: 'Bài Viết', href: '/admin/posts', icon: FileText },
    { name: 'Sắp xếp tin bài', href: '/admin/zone-posts', icon: LayoutList },
    { name: 'Danh Mục', href: '/admin/categories', icon: FolderTree },
    { name: 'Quảng Cáo', href: '/admin/ads', icon: MonitorPlay },
    { name: 'Auto Cloner', href: '/admin/auto-cloner', icon: RefreshCw },
  ]},
  { group: 'Kho Dữ Liệu', items: [
    { name: 'Dữ liệu chung', href: '/admin/general-data', icon: Database },
    { name: 'Cầu Thủ / VĐV', href: '/admin/entities', icon: Users },
    { name: 'Câu Lạc Bộ', href: '/admin/clubs', icon: Shield },
  ]},
  { group: 'Giao diện', items: [
    { name: 'Trang', href: '/admin/pages', icon: LayoutTemplate },
    { name: 'Khu Vực', href: '/admin/zones', icon: Layers },
  ]},
  { group: 'Hệ thống', items: [
    { name: 'Cài Đặt', href: '/admin/settings', icon: Settings },
    { name: 'API & AI', href: '/admin/settings/ai', icon: Cpu },
  ]}
]

interface AdminSidebarProps {
  userEmail: string
  userRole: string
  onSignOut: () => void
  onItemClick?: () => void
}

export function AdminSidebar({ userEmail, userRole, onSignOut, onItemClick }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={`bg-white/70 backdrop-blur-xl border-r border-slate-200/60 flex-shrink-0 flex flex-col shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 relative transition-all duration-300 h-screen sticky top-0 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      {/* Nút thu gọn / mở rộng */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-slate-200 text-slate-500 rounded-full p-1 shadow-sm hover:text-emerald-600 hover:border-emerald-200 transition-colors z-20 hidden md:block"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="h-20 flex items-center px-4 border-b border-slate-100 bg-white/50 justify-center">
        <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : 'px-4'}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-black text-xl">A</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden transition-all duration-300 whitespace-nowrap">
              <span className="font-black text-xl text-slate-800 tracking-tight">ANV SPORT</span>
              <span className="block text-[10px] font-bold text-emerald-600 tracking-widest uppercase">Workspace</span>
            </div>
          )}
        </div>
      </div>
      
      <nav className={`p-4 flex-1 overflow-y-auto ${isCollapsed ? 'space-y-4' : 'space-y-2'}`}>
        {MENU_ITEMS.map((group, idx) => (
          <React.Fragment key={idx}>
            {!isCollapsed && (
              <div className={`px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ${idx > 0 ? 'mt-4 md:mt-6' : 'mt-4'}`}>
                {group.group}
              </div>
            )}
            {isCollapsed && idx > 0 && <div className="h-px bg-slate-200 my-4 mx-2"></div>}
            
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  title={isCollapsed ? item.name : undefined}
                  onClick={() => {
                    if (onItemClick) {
                      onItemClick();
                    }
                  }}
                  className={`flex items-center rounded-xl transition-all group ${
                    isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                  } ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-600 font-bold' 
                      : 'text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'
                  }`} />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </React.Fragment>
        ))}
      </nav>

      <div className={`p-4 mt-auto border-t border-slate-100 bg-white/50 backdrop-blur-md ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {!isCollapsed ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0 flex items-center justify-center font-bold text-xs">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 truncate">{userEmail}</p>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {userRole}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mb-4 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-sm" title={userEmail}>
            {userEmail.charAt(0).toUpperCase()}
          </div>
        )}
        
        <form action={onSignOut} className="w-full">
          <button 
            type="submit"
            title={isCollapsed ? 'Đăng xuất' : undefined}
            className={`w-full flex items-center justify-center rounded-xl border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 group ${
              isCollapsed ? 'p-3' : 'gap-2 px-4 py-2.5 text-sm font-bold text-slate-600'
            }`}
          >
            <LogOut className={`w-4 h-4 flex-shrink-0 ${!isCollapsed && 'group-hover:-translate-x-1'} transition-transform duration-200 text-slate-500 group-hover:text-red-500`} />
            {!isCollapsed && <span>Đăng Xuất</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
