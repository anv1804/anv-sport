'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const encodedMessage = encodeURIComponent(`Đăng nhập thất bại: ${error.message}`)
    return redirect(`/admin/login?message=${encodedMessage}`)
  }

  // Check if user exists in local DB, if not, create
  if (data.user) {
    const existingUser = await prisma.user.findUnique({
      where: { supabaseUid: data.user.id }
    })
    
    if (!existingUser) {
      await prisma.user.create({
        data: {
          supabaseUid: data.user.id,
          email: data.user.email!,
          role: 'USER', // Default role
        }
      })
    }
  }

  return redirect('/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/')
}
