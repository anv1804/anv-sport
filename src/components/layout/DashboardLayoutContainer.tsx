'use client'

import React, { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'

interface DashboardLayoutContainerProps {
  userEmail: string
  userRole: string
  onSignOut: () => void
  children: React.ReactNode
}

export default function DashboardLayoutContainer({ 
  userEmail, 
  userRole, 
  onSignOut, 
  children 
}: DashboardLayoutContainerProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Khoá cuộn trang (body scroll) khi mở Sidebar trên mobile
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  // Lắng nghe phím Escape để đóng Sidebar nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30 relative">
      {/* Mobile Top Header */}
      <header className="flex md:hidden items-center justify-between px-4 h-16 bg-white/70 backdrop-blur-md border-b border-slate-200/60 z-20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="font-black text-base text-slate-800 tracking-tight">ANV SPORT</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileOpen}
        >
          {isMobileOpen ? (
            <X className="w-5 h-5 animate-in spin-in-90 duration-200" />
          ) : (
            <Menu className="w-5 h-5 animate-in fade-in duration-200" />
          )}
        </button>
      </header>

      {/* Sidebar container */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 transform md:relative md:translate-x-0 transition-transform duration-300 ease-out md:flex
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        <AdminSidebar 
          userEmail={userEmail}
          userRole={userRole}
          onSignOut={onSignOut}
          onItemClick={() => setIsMobileOpen(false)}
        />
      </div>

      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 md:hidden transition-all duration-300 animate-in fade-in"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative h-full min-w-0">
        {/* Decorative background blob */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-500/5 to-transparent -z-10 pointer-events-none"></div>
        <div className="p-4 sm:p-6 md:p-10 w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
