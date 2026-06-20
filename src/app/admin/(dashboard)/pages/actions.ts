'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

const SYSTEM_PAGES = [
  { slug: '/', title: 'Trang chủ', type: 'SYSTEM', isDeletable: false, settings: '{}' },
  { slug: '/category', title: 'Trang mục', type: 'SYSTEM', isDeletable: false, settings: '{}' },
  { slug: '/search', title: 'Trang tìm kiếm', type: 'SYSTEM', isDeletable: false, settings: '{}' },
  { slug: '/author', title: 'Trang tác giả', type: 'SYSTEM', isDeletable: false, settings: '{}' },
  { slug: '/prediction', title: 'Trang dự đoán', type: 'SYSTEM', isDeletable: false, settings: '{}' },
]

export async function getPages() {
  try {
    // Tự động seed các trang SYSTEM nếu chưa có
    for (const sysPage of SYSTEM_PAGES) {
      const exists = await prisma.page.findUnique({ where: { slug: sysPage.slug } })
      if (!exists) {
        await prisma.page.create({
          data: sysPage
        })
      }
    }

    const pages = await prisma.page.findMany({
      orderBy: [
        { type: 'desc' }, // SYSTEM lên trước
        { createdAt: 'desc' }
      ],
    })
    return { success: true, data: pages }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách Trang:', error)
    return { success: false, error: 'Không thể tải danh sách Trang' }
  }
}

export async function createPage(data: { title: string; slug: string; content?: string; status?: string; type?: string; settings?: string }) {
  try {
    const page = await prisma.page.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        settings: data.settings,
        type: data.type || 'CUSTOM',
        status: data.status || 'PUBLISHED',
      }
    })
    revalidatePath('/admin/pages')
    return { success: true, data: page }
  } catch (error) {
    console.error('Lỗi khi tạo Trang:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Đường dẫn (slug) đã tồn tại' }
    }
    return { success: false, error: 'Không thể tạo Trang mới' }
  }
}

export async function updatePage(id: string, data: { title?: string; slug?: string; content?: string; status?: string; settings?: string }) {
  try {
    // Không cho phép sửa slug của trang SYSTEM (để đảm bảo routing không gãy)
    const existing = await prisma.page.findUnique({ where: { id } })
    if (existing?.type === 'SYSTEM' && data.slug && data.slug !== existing.slug) {
      delete data.slug // Bỏ qua cập nhật slug
    }

    const page = await prisma.page.update({
      where: { id },
      data
    })
    revalidatePath('/admin/pages')
    return { success: true, data: page }
  } catch (error) {
    console.error('Lỗi khi cập nhật Trang:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Đường dẫn (slug) đã tồn tại' }
    }
    return { success: false, error: 'Không thể cập nhật Trang' }
  }
}

export async function deletePage(id: string) {
  try {
    const page = await prisma.page.findUnique({ where: { id } })
    if (page?.type === 'SYSTEM' || !page?.isDeletable) {
      return { success: false, error: 'Không thể xóa trang hệ thống' }
    }

    await prisma.page.delete({
      where: { id }
    })
    revalidatePath('/admin/pages')
    return { success: true }
  } catch (error) {
    console.error('Lỗi khi xóa Trang:', error)
    return { success: false, error: 'Không thể xóa Trang' }
  }
}
