import React from "react";
import { HorizontalPost } from "@/components/domain/article/HorizontalPost";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Bot } from "lucide-react";
import { createArticleUrl } from "@/lib/helpers/url";

export async function NewsFeed({ zoneId }: { zoneId?: string }) {
  const postSelect = {
    id: true, title: true, excerpt: true, imageUrl: true,
    createdAt: true, isAiGenerated: true, status: true
  };
  let posts: any[] = [];

  if (zoneId?.startsWith('category:')) {
    // Lấy bài từ Category (hoặc Category con) qua many-to-many
    const categoryId = zoneId.replace('category:', '');
    posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        categories: {
          some: {
            OR: [
              { id: categoryId },
              { parentId: categoryId }
            ]
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: postSelect
    });
  } else if (zoneId) {
    const zonePosts = await prisma.zonePost.findMany({
      where: { zoneId },
      orderBy: { position: 'asc' },
      take: 5,
      include: { post: { select: postSelect } }
    });
    posts = zonePosts.map(zp => zp.post);
  } else {
    posts = await prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: postSelect
    });
  }

  if (posts.length === 0) {
    return (
      <div className="w-full p-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center flex flex-col items-center justify-center">
        <span className="text-gray-400 mb-2">Chưa có bài viết nào được xuất bản.</span>
        <Link href="/admin/posts/new" className="text-[#16A34A] font-medium hover:underline">
          Vào CMS để viết bài đầu tiên
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 border-b-[2px] border-[#e5e5e5]">
         <h2 className="text-[16px] font-bold text-[var(--color-accent-main)] border-b-[2px] border-[var(--color-accent-main)] inline-block pb-2 -mb-[2px] uppercase tracking-wide">
           TIN TỨC ANV SPORT
         </h2>
         <span className="text-[12px] text-gray-500 font-medium">Bản quyền thuộc ANV</span>
      </div>
      
      {posts.map((article, index) => (
        <div key={article.id} className={`border-b border-[#e5e5e5] pb-5 mb-5 ${index === posts.length - 1 ? 'border-0 pb-0 mb-0' : ''}`}>
          <HorizontalPost 
            href={createArticleUrl(article.title, article.id)}
            title={article.title}
            excerpt={article.excerpt || ""}
            imageUrl={article.imageUrl || "/placeholder-news.jpg"}
            titlePosition="top"
            size="md"
            className="border-0 pb-0 mb-0"
          />
          {article.isAiGenerated && (
            <div className="mt-2 flex items-center text-xs text-purple-600 font-medium bg-purple-50 inline-block px-2 py-1 rounded">
              <Bot className="w-3 h-3 mr-1" /> AI Writer
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function NewsFeedSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-4 border-b-[2px] border-[#e5e5e5]">
        <h2 className="text-[16px] font-bold text-[var(--color-accent-main)] border-b-[2px] border-[var(--color-accent-main)] inline-block pb-2 -mb-[2px] uppercase tracking-wide">
          TIN TỨC ANV SPORT
        </h2>
        <span className="text-[12px] text-gray-500 font-medium">Bản quyền thuộc ANV</span>
      </div>
      {[1, 2, 3, 4, 5].map((n, index) => (
        <div key={n} className={`border-b border-[#e5e5e5] pb-5 mb-5 ${index === 4 ? 'border-0 pb-0 mb-0' : ''}`}>
          <HorizontalPost 
            isLoading={true}
            titlePosition="top"
            size="md"
            className="border-0 pb-0 mb-0"
          />
        </div>
      ))}
    </div>
  );
}
