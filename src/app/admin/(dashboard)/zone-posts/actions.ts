'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Lấy danh sách bài viết theo Zone
export async function getZonePosts(zoneId: string) {
  try {
    const zonePosts = await prisma.zonePost.findMany({
      where: { zoneId },
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
    // Tách bài được print và bài thường
    const isPrintedActive = (p: any) => p.isPrinted && (!p.printStartTime || p.printStartTime <= now) && (!p.printEndTime || p.printEndTime > now);
    
    const printedPosts = zonePosts.filter(isPrintedActive);
    const normalPosts = zonePosts.filter(p => !isPrintedActive(p));
    
    // Bài print được xếp đầu
    const sortedPosts = [...printedPosts, ...normalPosts];

    return { success: true, data: sortedPosts }
  } catch (error) {
    console.error('Lỗi khi lấy ZonePosts:', error)
    return { success: false, error: 'Không thể tải danh sách bài viết' }
  }
}

// Thiết lập Print cho ZonePost
export async function setPrintZonePost(id: string, isPrinted: boolean, printStartTime: Date | null, printEndTime: Date | null, targetId?: string) {
  try {
    const start = printStartTime ? new Date(printStartTime) : null;
    const end = printEndTime ? new Date(printEndTime) : null;

    if (id.startsWith('temp-')) {
      const postId = parseInt(id.replace('temp-', ''));
      const zoneId = targetId;

      if (!zoneId) {
        return { success: false, error: 'Không tìm thấy Zone để gán bài viết' };
      }

      await prisma.zonePost.create({
        data: {
          zoneId,
          postId,
          position: 0,
          isPrinted,
          printStartTime: start,
          printEndTime: end
        }
      });
    } else {
      await prisma.zonePost.update({
        where: { id },
        data: { isPrinted, printStartTime: start, printEndTime: end }
      });
    }

    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi khi cấu hình Print ZonePost:', error)
    return { success: false, error: 'Không thể cập nhật cấu hình Print' }
  }
}

// Cập nhật vị trí kéo thả
export async function updateZonePostPositions(zoneId: string, updates: { id: string, position: number }[]) {
  try {
    // Dùng transaction để đảm bảo toàn vẹn dữ liệu
    await prisma.$transaction(
      updates.map(update => 
        prisma.zonePost.update({
          where: { id: update.id },
          data: { position: update.position }
        })
      )
    )
    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi khi cập nhật vị trí:', error)
    return { success: false, error: 'Không thể lưu vị trí' }
  }
}

// Thêm hàng loạt bài viết vào Zone
export async function addPostsToZone(zoneId: string, postIds: number[]) {
  try {
    // Lấy vị trí lớn nhất hiện tại
    const maxPos = await prisma.zonePost.findFirst({
      where: { zoneId },
      orderBy: { position: 'desc' }
    })
    
    let currentPosition = maxPos ? maxPos.position + 1 : 0;
    
    const newRecords = postIds.map(postId => ({
      zoneId,
      postId,
      position: currentPosition++
    }))

    await prisma.zonePost.createMany({
      data: newRecords,
      skipDuplicates: true // Bỏ qua nếu đã có trong zone
    })

    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi thêm bài viết vào Zone:', error)
    return { success: false, error: 'Không thể thêm bài viết' }
  }
}

// Xóa bài viết khỏi Zone
export async function removePostFromZone(id: string) {
  try {
    await prisma.zonePost.delete({
      where: { id }
    })
    revalidatePath('/admin/zone-posts')
    return { success: true }
  } catch (error) {
    console.error('Lỗi xóa bài viết khỏi Zone:', error)
    return { success: false, error: 'Không thể xóa bài viết khỏi Zone' }
  }
}

// Tìm kiếm bài viết để thêm vào
export async function searchPostsForZone(params: {
  keyword?: string;
  categoryId?: string;
  timeRange?: string;
}) {
  try {
    let where: any = {};
    
    if (params.keyword) {
      where.title = { contains: params.keyword, mode: 'insensitive' }
    }
    
    if (params.categoryId) {
      where.categories = { some: { id: params.categoryId } }
    }
    
    if (params.timeRange === '7days') {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      where.createdAt = { gte: date }
    } else if (params.timeRange === '30days') {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      where.createdAt = { gte: date }
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Giới hạn 50 bài để tối ưu
      select: {
        id: true,
        title: true,
        createdAt: true,
        categories: { select: { name: true } }
      }
    })
    
    return { success: true, data: posts }
  } catch (error) {
    console.error('Lỗi tìm bài viết:', error)
    return { success: false, error: 'Không thể tìm kiếm' }
  }
}
