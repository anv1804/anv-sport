import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TARGET_EMAIL = 'nguyenan18404@gmail.com'

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  console.log(`Đang tạo đường dẫn đăng nhập thần kỳ (Magic Link) cho ${TARGET_EMAIL}...`)
  
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: TARGET_EMAIL,
    options: {
      redirectTo: 'http://localhost:3000/auth/callback?next=/admin',
    }
  })

  if (error) {
    console.error('❌ Lỗi:', error.message)
    return
  }

  console.log('\n✅ Tạo thành công! Để đăng nhập vào hệ thống ngay lập tức mà KHÔNG CẦN CHECK MAIL, hãy copy và dán đường dẫn dưới đây vào trình duyệt của bạn:\n')
  
  const originalLink = data.properties?.action_link || ''
  
  console.log('🔗 Link đăng nhập của bạn:');
  console.log('\x1b[36m%s\x1b[0m', originalLink); // Cyan color
  console.log('\n(Link này chỉ có tác dụng 1 lần duy nhất)');
}

main().catch(console.error)
