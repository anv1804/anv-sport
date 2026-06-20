import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TARGET_EMAIL = 'nguyenan18404@gmail.com'

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Cập nhật mật khẩu cho user
  const { data, error } = await supabase.auth.admin.updateUserById(
    '177749b9-fbfe-4f1d-93c2-0fa4b15406a8', // ID từ log trước
    { password: 'Password123!' }
  )

  if (error) {
    console.error('❌ Lỗi:', error.message)
    return
  }

  console.log('✅ Đã đặt mật khẩu thành công: Password123!')
}

main().catch(console.error)
