import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const TARGET_EMAIL = 'nguyenan18404@gmail.com'

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log(`📧 Đang thử gửi email tới ${TARGET_EMAIL}...`)
  
  const { error } = await supabase.auth.signInWithOtp({
    email: TARGET_EMAIL,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: 'http://localhost:3000/auth/callback',
    },
  })

  if (error) {
    console.error('❌ Lỗi:', error.message, error.status)
    if (error.status === 429) {
      console.log('👉 Lỗi 429: Đã chạm giới hạn gửi email của Supabase (Rate Limit).')
    }
    return
  }

  console.log('\n✅ Lệnh gửi thành công (Không có lỗi trả về)!')
}

main().catch(console.error)
