import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Settings } from 'lucide-react';
import PostListClient from "./PostListClient";
import BulkCrawlButton from "@/components/admin/BulkCrawlButton";
import { evaluateSeo } from "@/lib/seo/evaluator";
import { Button } from "@/components/ui/Button";

// Force rebuild to resolve stale SSR hydration cache
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1;
  const limit = 25;
  const skip = (page - 1) * limit;
  const status = resolvedParams?.status || "ALL";
  const search = resolvedParams?.search || "";

  // 1. Xây dựng bộ lọc (Where clause)
  const where: any = {};
  if (status !== "ALL") {
    if (status === "PENDING") {
      where.status = { in: ["PENDING_EDITOR", "PENDING_PUBLISH"] };
    } else {
      where.status = status;
    }
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
    ];
    const searchId = parseInt(search);
    if (!isNaN(searchId)) {
      where.OR.push({ id: searchId });
    }
  }

  // 2. Truy vấn đồng thời (Parallel Queries) để tăng tốc
  const [posts, totalFilteredCount, groupCounts, rawCategories] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        excerpt: true,
        imageUrl: true,
        status: true,
        type: true,
        author: true,
        createdAt: true,
        metadata: true,
        categories: true
      }
    }),
    prisma.post.count({ where }),
    prisma.post.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.category.findMany({
      select: { id: true, parentId: true, slug: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);

  // 3. Tính toán số lượng cho từng Tab (Counts)
  const counts = { ALL: 0, DRAFT: 0, PENDING: 0, PUBLISHED: 0, ARCHIVED: 0, REJECTED: 0 };
  groupCounts.forEach(item => {
    counts.ALL += item._count;
    if (item.status === 'DRAFT') counts.DRAFT += item._count;
    if (item.status === 'PUBLISHED') counts.PUBLISHED += item._count;
    if (item.status === 'ARCHIVED') counts.ARCHIVED += item._count;
    if (item.status === 'REJECTED') counts.REJECTED += item._count;
    if (item.status === 'PENDING_EDITOR' || item.status === 'PENDING_PUBLISH') counts.PENDING += item._count;
  });

  // 4. Lấy điểm SEO & Word Count từ Metadata (đã được làm giàu hoặc tính toán sẵn)
  const optimizedPosts = posts.map(post => {
    let parsedMetadata: any = {};
    try {
      if (post.metadata) parsedMetadata = JSON.parse(post.metadata);
    } catch (e) {}

    // Lấy sẵn từ metadata hoặc tính toán lại nếu có sẵn content (fallback cho cũ)
    let seoScore = parsedMetadata.seoScore !== undefined ? parsedMetadata.seoScore : 70;
    let wordCount = parsedMetadata.wordCount !== undefined ? parsedMetadata.wordCount : 250;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      imageUrl: post.imageUrl,
      status: post.status,
      type: post.type,
      author: post.author,
      createdAt: post.createdAt,
      categories: post.categories,
      metadata: post.metadata,
      seoScore: seoScore,
      wordCount: wordCount
    };
  });

  const categoryMap = new Map(rawCategories.map(c => [c.id, c]));
  const rootCategories = rawCategories.filter(c => !c.parentId || !categoryMap.has(c.parentId));

  const categories: {slug: string, name: string}[] = [];
  const addCategoryToFlatList = (cat: any, level: number) => {
    const prefix = level > 0 ? '— '.repeat(level) : '';
    categories.push({ slug: cat.slug, name: prefix + cat.name });
    const children = rawCategories.filter(c => c.parentId === cat.id);
    children.forEach(child => addCategoryToFlatList(child, level + 1));
  };

  rootCategories.forEach(root => addCategoryToFlatList(root, 0));

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Danh sách tin bài</h1>
          <p className="text-slate-500 font-medium">Quản lý, tìm kiếm và thao tác với tất cả bài báo trong hệ thống</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="text-[13px] px-3 sm:px-4" title="Cài đặt hiển thị">
            <Settings className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">Cài đặt hiển thị</span>
          </Button>
          <BulkCrawlButton categories={categories} />
          <Link href="/admin/posts/new" prefetch={false} className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center text-[13px]" title="Tạo bài viết mới">
            <Plus className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Tạo bài viết mới</span>
          </Link>
        </div>
      </div>

      {/* COMPONENT DANH SÁCH */}
      <PostListClient 
        initialPosts={optimizedPosts as any} 
        totalCount={totalFilteredCount}
        currentPage={page}
        counts={counts}
        currentStatus={status}
      />
    </div>
  );
}
