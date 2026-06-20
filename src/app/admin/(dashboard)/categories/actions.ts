'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCategory(data: { name: string; slug: string; description?: string; parentId?: string; isActive?: boolean }) {
  try {
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug }
    })
    
    if (existing) {
      return { success: false, error: 'Đường dẫn (slug) đã tồn tại!' }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        ...(data.parentId ? { parent: { connect: { id: data.parentId } } } : {}),
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })
    
    revalidatePath('/admin/categories')
    return { success: true, data: category }
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi hệ thống' }
  }
}

export async function updateCategory(id: string, data: { name: string; slug: string; description?: string; parentId?: string; isActive?: boolean }) {
  try {
    // Prevent self-parenting
    if (id === data.parentId) {
      return { success: false, error: 'Danh mục không thể làm cha của chính nó!' }
    }

    const existing = await prisma.category.findUnique({
      where: { slug: data.slug }
    })
    
    if (existing && existing.id !== id) {
      return { success: false, error: 'Đường dẫn (slug) đã tồn tại ở danh mục khác!' }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        ...(data.parentId ? { parent: { connect: { id: data.parentId } } } : { parent: { disconnect: true } }),
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    })
    
    revalidatePath('/admin/categories')
    return { success: true, data: category }
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi hệ thống' }
  }
}

export async function deleteCategory(id: string) {
  try {
    // If it has children, we need to decide what to do. Let's set their parentId to null or the parent's parentId.
    // For simplicity, we'll set children's parentId to null (make them root categories)
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    })

    await prisma.category.delete({
      where: { id }
    })

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi hệ thống' }
  }
}

export async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: {
        select: { posts: true }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
  
  return categories
}
