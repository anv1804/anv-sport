import React from "react"
import Link from "next/link"
import { signOut } from "../login/actions"

import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

import { UnsavedChangesProvider } from '@/components/providers/UnsavedChangesProvider'
import { ConfirmProvider } from '@/components/providers/ConfirmProvider'
import DashboardLayoutContainer from "@/components/layout/DashboardLayoutContainer"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Check role in local database
  let dbUser = await prisma.user.findUnique({
    where: { supabaseUid: user.id }
  })

  // Auto-provision admin sau khi reset database
  if (!dbUser && user.email === 'nguyenan18404@gmail.com') {
    dbUser = await prisma.user.create({
      data: {
        supabaseUid: user.id,
        email: user.email,
        role: 'ADMIN'
      }
    });
  }

  // For this CMS, only allow ADMIN (or maybe EDITOR, but let's restrict to ADMIN for now)
  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'EDITOR')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⛔</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Truy cập bị từ chối</h1>
          <p className="text-slate-500 mb-8 font-medium">
            Tài khoản của bạn (<span className="text-slate-800 font-bold">{user.email}</span>) chưa được phân quyền quản trị. Vui lòng liên hệ Admin để cấp quyền.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Về trang chủ</Link>
            <form action={signOut}>
              <button className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 transition-all">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ConfirmProvider>
      <UnsavedChangesProvider>
        <DashboardLayoutContainer
          userEmail={user.email!}
          userRole={dbUser.role}
          onSignOut={signOut}
        >
          {children}
        </DashboardLayoutContainer>
      </UnsavedChangesProvider>
    </ConfirmProvider>
  )
}
