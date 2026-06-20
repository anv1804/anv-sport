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
  const [posts, totalFilteredCount, groupCounts] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { categories: true }
    }),
    prisma.post.count({ where }),
    prisma.post.groupBy({
      by: ['status'],
      _count: true
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

  // 4. Tính toán điểm SEO & Word Count tại Server cho trang hiện tại (tối đa 25 bài)
  const optimizedPosts = posts.map(post => {
    let parsedMetadata: any = {};
    try {
      if (post.metadata) parsedMetadata = JSON.parse(post.metadata);
    } catch (e) {}

    const seoResult = evaluateSeo({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content || "",
      keywords: parsedMetadata.seoKeywords || "",
      seoTitle: parsedMetadata.seoTitle,
      seoDescription: parsedMetadata.seoDescription,
      seoUrl: parsedMetadata.seoUrl
    });

    const wordCount = post.content ? post.content.replace(/<[^>]*>?/gm, " ").trim().split(/\s+/).filter(w => w.length > 0).length : 0;

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
      seoScore: seoResult.score,
      wordCount: wordCount
    };
  });

  const rawCategories = await prisma.category.findMany({
    select: { id: true, parentId: true, slug: true, name: true },
    orderBy: { name: "asc" }
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
          <Link href="/admin/posts/new" className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center text-[13px]" title="Tạo bài viết mới">
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
