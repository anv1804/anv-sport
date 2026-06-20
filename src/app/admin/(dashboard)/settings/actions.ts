'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSetting(key: string) {
  const setting = await prisma.setting.findUnique({
    where: { key }
  })
  return setting ? setting.value : null
}

export async function getAllSettings() {
  const settings = await prisma.setting.findMany({
    select: {
      key: true,
      updatedAt: true,
      value: true
    }
  })
  return settings
}

export async function updateSetting(key: string, value: string) {
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    })
    
    // Xóa cache nếu có hiển thị ở ngoài frontend
    revalidatePath('/')
    revalidatePath('/admin/settings')
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi hệ thống' }
  }
}
