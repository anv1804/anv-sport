import { Metadata } from 'next';
import PredictionClientPage from './PredictionClientPage';
import prisma from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Nhận Định & Dự Đoán Bóng Đá AI | ANV Sport',
  description: 'Công cụ AI dự đoán và phân tích chi tiết trận đấu bóng đá trực tiếp.',
};

export default async function Page() {
  // Query 5 latest AI-generated posts
  let aiPosts = await prisma.post.findMany({
    where: {
      isAiGenerated: true,
      status: 'PUBLISHED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    select: {
      id: true,
      title: true,
      excerpt: true,
      imageUrl: true,
      createdAt: true,
    }
  });

  // Fallback to top regular posts if no AI posts
  if (aiPosts.length === 0) {
    aiPosts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        excerpt: true,
        imageUrl: true,
        createdAt: true,
      }
    });
  }

  // Convert Date objects to strings for serialization
  const serializedAiPosts = aiPosts.map(post => ({
    ...post,
    createdAt: post.createdAt.toISOString()
  }));

  return <PredictionClientPage initialAiPosts={serializedAiPosts} />;
}
