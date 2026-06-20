'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

// Hàm lấy tất cả Zones
export async function getZones() {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        page: { select: { id: true, title: true } },
        _count: { select: { zonePosts: true } }
      }
    })
    return { success: true, data: zones }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách Zone:', error)
    return { success: false, error: 'Không thể tải danh sách Zone' }
  }
}

// Hàm thêm Zone mới
export async function createZone(data: { name: string; slug: string; description?: string; isActive?: boolean; pageId?: string | null }) {
  try {
    const zone = await prisma.zone.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        isActive: data.isActive ?? true,
        pageId: data.pageId || null,
      }
    })
    revalidatePath('/admin/zones')
    return { success: true, data: zone }
  } catch (error) {
    console.error('Lỗi khi tạo Zone:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Đường dẫn (slug) đã tồn tại' }
    }
    return { success: false, error: 'Không thể tạo Zone mới' }
  }
}

// Hàm cập nhật Zone
export async function updateZone(id: string, data: { name?: string; slug?: string; description?: string; isActive?: boolean; pageId?: string | null }) {
  try {
    const zone = await prisma.zone.update({
      where: { id },
      data
    })
    revalidatePath('/admin/zones')
    return { success: true, data: zone }
  } catch (error) {
    console.error('Lỗi khi cập nhật Zone:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Đường dẫn (slug) đã tồn tại' }
    }
    return { success: false, error: 'Không thể cập nhật Zone' }
  }
}

// Hàm xóa Zone
export async function deleteZone(id: string) {
  try {
    await prisma.zone.delete({
      where: { id }
    })
    revalidatePath('/admin/zones')
    return { success: true }
  } catch (error) {
    console.error('Lỗi khi xóa Zone:', error)
    return { success: false, error: 'Không thể xóa Zone' }
  }
}

// Hàm bật/tắt Zone
export async function toggleZoneStatus(id: string, isActive: boolean) {
  try {
    const zone = await prisma.zone.update({
      where: { id },
      data: { isActive }
    })
    revalidatePath('/admin/zones')
    return { success: true, data: zone }
  } catch (error) {
    console.error('Lỗi khi đổi trạng thái Zone:', error)
    return { success: false, error: 'Không thể đổi trạng thái Zone' }
  }
}
