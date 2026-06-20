import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  // Đăng nhập tự động bằng mật khẩu đã set qua Admin API
  const { error } = await supabase.auth.signInWithPassword({
    email: 'nguyenan18404@gmail.com',
    password: 'Password123!'
  })

  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?message=${encodeURIComponent(error.message)}`)
  }

  // Đăng nhập thành công, chuyển hướng vào trang admin
  return NextResponse.redirect(`${origin}/admin`)
}
