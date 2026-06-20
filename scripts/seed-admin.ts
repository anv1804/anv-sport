/**
 * Script: seed-admin.ts
 * Tạo user Supabase + gán role ADMIN trong DB local
 * Chạy: npx tsx scripts/seed-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TARGET_EMAIL = 'nguyenan18404@gmail.com'

async function main() {
  if (!SERVICE_ROLE_KEY) {
    console.error('❌ Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local')
    process.exit(1)
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const prisma = new PrismaClient()

  console.log(`🔍 Tìm kiếm user ${TARGET_EMAIL} trên Supabase...`)

  // Tìm user đã có trên Supabase Auth
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    console.error('❌ Lỗi khi lấy danh sách users:', listError.message)
    process.exit(1)
  }

  let supabaseUser = listData.users.find(u => u.email === TARGET_EMAIL)

  // Nếu chưa có → tạo mới
  if (!supabaseUser) {
    console.log(`📧 Tạo user mới trên Supabase Auth...`)
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: TARGET_EMAIL,
      email_confirm: true, // Bỏ qua bước confirm email
    })
    if (createError) {
      console.error('❌ Lỗi tạo user Supabase:', createError.message)
      process.exit(1)
    }
    supabaseUser = createData.user
    console.log(`✅ Đã tạo user Supabase: ${supabaseUser.id}`)
  } else {
    console.log(`✅ Tìm thấy user Supabase: ${supabaseUser.id}`)
  }

  // Upsert vào DB local với role ADMIN
  const dbUser = await prisma.user.upsert({
    where: { supabaseUid: supabaseUser.id },
    update: { role: 'ADMIN', email: TARGET_EMAIL },
    create: {
      supabaseUid: supabaseUser.id,
      email: TARGET_EMAIL,
      role: 'ADMIN',
    },
  })

  console.log(`\n🎉 Thành công!`)
  console.log(`   Email  : ${dbUser.email}`)
  console.log(`   Role   : ${dbUser.role}`)
  console.log(`   DB ID  : ${dbUser.id}`)
  console.log(`\n👉 Bạn có thể đăng nhập tại /admin/login bằng email OTP hoặc Google.`)

  await prisma.$disconnect()
}

main().catch(console.error)
