/**
 * Test: Gửi OTP email trực tiếp qua Supabase Admin
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TARGET_EMAIL = 'nguyenan18404@gmail.com'

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Thử generate OTP trực tiếp bằng Admin API
  console.log(`📧 Tạo OTP cho ${TARGET_EMAIL}...`)
  
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: TARGET_EMAIL,
  })

  if (error) {
    console.error('❌ Lỗi:', error.message)
    return
  }

  console.log('\n✅ Đã tạo thành công!')
  console.log('📋 Token (OTP-like):', data.properties?.email_otp || 'N/A')
  console.log('🔗 Magic Link:', data.properties?.action_link || 'N/A')
  console.log('\n💡 Supabase project đang dùng loại email: MagicLink')
  console.log('   → Vào Supabase Dashboard > Authentication > Email Templates')
  console.log('   → Chọn "OTP" làm kiểu mặc định để nhận mã 6 số.')
}

main().catch(console.error)
