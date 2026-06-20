'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Lấy danh sách bài viết theo Category (những bài được gắp thủ công + bài mới nhất)
export async function getCategoryPosts(categoryId: string) {
  try {
    const categoryPosts = await prisma.categoryPost.findMany({
      where: { categoryId },
      orderBy: { position: 'asc' },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            status: true,
            imageUrl: true,
            createdAt: true,
            categories: { select: { name: true } }
          }
        }
      }
    })

    const now = new Date();
    // Tách bài được print và bài thường cho những bài gắp thủ công
    const isPrintedActive = (p: any) => p.isPrinted && (!p.printStartTime || p.printStartTime <= now) && (!p.printEndTime || p.printEndTime > now);

    const printedPosts = categoryPosts.filter(isPrintedActive);
    const normalPosts = categoryPosts.filter(p => !isPrintedActive(p));
    
    // Bài print được xếp đầu
    const sortedCategoryPosts = [...printedPosts, ...normalPosts];

    const featuredPostIds = categoryPosts.map(cp => cp.postId);

    // Lấy thêm 20 bài viết mới nhất thuộc danh mục này nhưng chưa được sắp xếp thủ công
    const recentPosts = await prisma.post.findMany({
      where: {
        categories: { some: { id: categoryId } },
        id: { notIn: featuredPostIds }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        imageUrl: true,
        createdAt: true,
        categories: { select: { name: true } }
      }
    });

    const recentFormatted = recentPosts.map(post => ({
      id: `temp-${post.id}`, // Đánh dấu là chưa có trong CategoryPost
      categoryId,
      postId: post.id,
      position: 999, // Vị trí tạm
      isPrinted: false,
      printStartTime: null,
      printEndTime: null,
      post
    }));

    const resultData = [...sortedCategoryPosts, ...recentFormatted];
    return JSON.parse(JSON.stringify({ success: true, data: resultData }));
  } catch (error: any) {
    console.error('Lỗi khi lấy CategoryPosts:', error)
    return { success: false, error: 'Không thể tải danh sách bài viết' }
  }
}

// Thiết lập Print cho CategoryPost
export async function setPrintCategoryPost(id: string, isPrinted: boolean, printStartTime: Date | null, printEndTime: Date | null) {
  try {
    await prisma.categoryPost.update({
      where: { id },
      data: { isPrinted, printStartTime, printEndTime }
    })
    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi khi cấu hình Print CategoryPost:', error)
    return { success: false, error: 'Không thể cập nhật cấu hình Print' }
  }
}

// Cập nhật vị trí kéo thả cho Category
export async function updateCategoryPostPositions(categoryId: string, updates: { id: string, position: number }[]) {
  try {
    const toUpdate = updates.filter(u => !u.id.startsWith('temp-'));
    const toCreate = updates.filter(u => u.id.startsWith('temp-'));

    await prisma.$transaction([
      ...toUpdate.map(update => 
        prisma.categoryPost.update({
          where: { id: update.id },
          data: { position: update.position }
        })
      ),
      ...toCreate.map(create => 
        prisma.categoryPost.create({
          data: {
            categoryId,
            postId: parseInt(create.id.replace('temp-', '')),
            position: create.position
          }
        })
      )
    ]);

    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi khi cập nhật vị trí:', error)
    return { success: false, error: 'Không thể lưu vị trí' }
  }
}

// Thêm hàng loạt bài viết vào Category Featured
export async function addPostsToCategoryFeatured(categoryId: string, postIds: number[]) {
  try {
    // Lấy vị trí lớn nhất hiện tại
    const maxPos = await prisma.categoryPost.findFirst({
      where: { categoryId },
      orderBy: { position: 'desc' }
    })
    
    let currentPosition = maxPos ? maxPos.position + 1 : 0;
    
    const newRecords = postIds.map(postId => ({
      categoryId,
      postId,
      position: currentPosition++
    }))

    await prisma.categoryPost.createMany({
      data: newRecords,
      skipDuplicates: true // Bỏ qua nếu đã có trong category
    })

    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi thêm bài viết vào Category:', error)
    return { success: false, error: 'Không thể thêm bài viết' }
  }
}

// Xóa bài viết khỏi Category Featured
export async function removePostFromCategoryFeatured(id: string) {
  try {
    await prisma.categoryPost.delete({
      where: { id }
    })
    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi xóa bài viết khỏi Category:', error)
    return { success: false, error: 'Không thể xóa bài viết khỏi Category' }
  }
}
