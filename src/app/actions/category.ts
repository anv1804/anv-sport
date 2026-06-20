'use server'

import prisma from '@/lib/prisma'

export async function loadMoreCategoryPosts(categoryIds: string[], skip: number, take: number = 5) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        categories: {
          some: {
            id: { in: categoryIds }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take,
      select: {
        id: true,
        title: true,
        excerpt: true,
        imageUrl: true,
        createdAt: true,
      }
    });

    // In Prisma schema, Post has no slug.
    return posts.map(post => ({
      ...post,
      slug: (post as any).slug || post.id.toString(),
    }));
  } catch (error) {
    console.error('Error loading more category posts:', error);
    return [];
  }
}
