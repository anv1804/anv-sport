import React from "react";
import prisma from "@/lib/prisma";
import { CategoryBlock } from "./CategoryBlock";
import { HorizontalPost } from "@/components/domain/article/HorizontalPost";
import { VerticalPost } from "@/components/domain/article/VerticalPost";
import { createArticleUrl } from "@/lib/helpers/url";

export async function DynamicCategoryBlock({ zoneId, isSticky, index = 0 }: { zoneId: string, isSticky?: boolean, index?: number }) {
  if (!zoneId) return null;

  const isCategory = zoneId.startsWith('category:');
  const actualId = isCategory ? zoneId.split('category:')[1] : zoneId;

  let blockName = '';
  let posts: any[] = [];

  let subcategories: { name: string; href: string }[] | undefined = undefined;

  const now = new Date();
  const isPrintedValid = (item: any) => {
    if (!item.isPrinted) return false;
    if (item.printStartTime && new Date(item.printStartTime) > now) return false;
    if (item.printEndTime && new Date(item.printEndTime) <= now) return false;
    return true;
  };

  if (isCategory) {
    const postSelect = {
      id: true, title: true, excerpt: true, imageUrl: true,
      createdAt: true, status: true, isAiGenerated: true,
      categories: { select: { id: true, name: true, slug: true } }
    };

    const [category, featuredPosts] = await Promise.all([
      prisma.category.findUnique({
        where: { id: actualId },
        select: {
          name: true,
          children: {
            where: { isActive: true },
            take: 5,
            select: { id: true, name: true, slug: true }
          }
        }
      }),
      prisma.categoryPost.findMany({
        where: { categoryId: actualId },
        orderBy: { position: 'asc' },
        include: { post: { select: postSelect } }
      })
    ]);

    if (!category) return null;

    blockName = category.name;
    if (category.children && category.children.length > 0) {
      subcategories = category.children.map((c: any) => ({
        name: c.name,
        href: `/${c.slug}`
      }));
    }

    // Đưa bài ghim hợp lệ lên đầu
    const printedPosts = featuredPosts.filter(isPrintedValid);
    const unprintedPosts = featuredPosts.filter(fp => !isPrintedValid(fp));
    const sortedFeaturedPosts = [...printedPosts, ...unprintedPosts];
    
    posts = sortedFeaturedPosts.map((fp: any) => fp.post).filter((p: any) => p.status === 'PUBLISHED');

    // Lấp đầy bằng các bài viết mới nhất nếu chưa đủ 6 bài
    if (posts.length < 6) {
      const recentPosts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          categories: { some: { id: actualId } },
          id: { notIn: posts.map((p: any) => p.id) }
        },
        orderBy: { createdAt: 'desc' },
        take: 6 - posts.length,
        select: postSelect
      });
      posts = [...posts, ...recentPosts];
    }
  } else {
    const zone = await prisma.zone.findUnique({
      where: { id: actualId },
      select: {
        name: true,
        zonePosts: {
          orderBy: { position: 'asc' },
          take: 8,
          select: {
            isPrinted: true,
            printStartTime: true,
            printEndTime: true,
            post: {
              select: {
                id: true, title: true, excerpt: true, imageUrl: true,
                createdAt: true, status: true, isAiGenerated: true,
                categories: { select: { id: true, name: true, slug: true } }
              }
            }
          }
        }
      }
    });

    if (!zone) return null;
    blockName = zone.name;

    // Đưa bài ghim hợp lệ lên đầu
    const printedPosts = zone.zonePosts.filter(isPrintedValid);
    const unprintedPosts = zone.zonePosts.filter(zp => !isPrintedValid(zp));
    const sortedZonePosts = [...printedPosts, ...unprintedPosts];

    posts = sortedZonePosts.map(zp => zp.post).slice(0, 6);
  }

  if (posts.length === 0) return null;

  const layoutType = index % 3;

  const renderLayout = () => {
    // Layout 1: Nghịch đảo của Layout 0 (Bài dọc bên trái, Bài ngang bên phải)
    if (layoutType === 1) {
      const mainPost = posts[0];
      const subPost = posts.length > 1 ? posts[1] : null;
      const listPosts = posts.slice(2, 5);

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {subPost && (
              <div className="md:col-span-1 md:border-r border-[#e5e5e5] md:pr-6 flex flex-col">
                  <VerticalPost 
                    href={createArticleUrl(subPost.title, subPost.id)}
                    title={subPost.title}
                    excerpt={subPost.excerpt || ""}
                    hideExcerpt={false}
                    size="sm" 
                    hideImage={true} 
                    titlePosition="top" 
                    titleLines={3}
                    excerptLines={2}
                  />
              </div>
            )}
            <div className={`md:col-span-2 ${!subPost ? 'md:col-span-3' : ''}`}>
                <HorizontalPost 
                  href={createArticleUrl(mainPost.title, mainPost.id)}
                  title={mainPost.title}
                  excerpt={mainPost.excerpt || ""}
                  imageUrl={mainPost.imageUrl || undefined}
                  imageClass="w-[45%] md:w-[48%]" 
                  size="md"
                  titleLines={3}
                  excerptLines={2}
                />
            </div>
          </div>
          {renderList(listPosts)}
        </>
      );
    }

    // Layout 2: 3 Bài dọc dàn hàng ngang, không hiển thị list text bên dưới
    if (layoutType === 2 && posts.length >= 3) {
      const topPosts = posts.slice(0, 3);
      // Có thể hiển thị thêm list bên dưới nếu muốn, nhưng để Layout thoáng hơn thì bỏ đi cũng được
      // Hoặc giữ nguyên list bên dưới bằng posts.slice(3, 6)
      const listPosts = posts.slice(3, 6);

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {topPosts.map((post, i) => (
              <div key={post.id} className={i < 2 ? "md:border-r border-[#e5e5e5] md:pr-6 flex flex-col" : "flex flex-col"}>
                 <VerticalPost 
                    href={createArticleUrl(post.title, post.id)}
                    title={post.title}
                    imageUrl={post.imageUrl || undefined}
                    size="sm"
                    titlePosition="bottom"
                    hideExcerpt={true}
                    titleLines={3}
                 />
              </div>
            ))}
          </div>
          {renderList(listPosts)}
        </>
      );
    }

    // Layout 0: Mặc định (Bài ngang bên trái, Bài dọc bên phải)
    const mainPost = posts[0];
    const subPost = posts.length > 1 ? posts[1] : null;
    const listPosts = posts.slice(2, 5);

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2 md:border-r border-[#e5e5e5] md:pr-6">
              <HorizontalPost 
                href={createArticleUrl(mainPost.title, mainPost.id)}
                title={mainPost.title}
                excerpt={mainPost.excerpt || ""}
                imageUrl={mainPost.imageUrl || undefined}
                imageClass="w-[45%] md:w-[48%]" 
                size="md"
                titleLines={3}
                excerptLines={2}
              />
          </div>
          {subPost && (
            <div className="md:col-span-1 flex flex-col">
                <VerticalPost 
                  href={createArticleUrl(subPost.title, subPost.id)}
                  title={subPost.title}
                  excerpt={subPost.excerpt || ""}
                  hideExcerpt={false}
                  size="sm" 
                  hideImage={true} 
                  titlePosition="top" 
                  titleLines={3}
                  excerptLines={2}
                />
            </div>
          )}
        </div>
        {renderList(listPosts)}
      </>
    );
  };

  const renderList = (listPosts: any[]) => {
    if (!listPosts || listPosts.length === 0) return null;
    return (
      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-[#e5e5e5]">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {listPosts.map((post) => (
            <li key={post.id} className="relative pl-3 md:pl-4 before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-[5px] before:h-[5px] before:bg-gray-400 before:rounded-full">
              <a href={createArticleUrl(post.title, post.id)} className="text-[14px] md:text-[15px] font-bold text-[#222222] hover:text-[var(--color-accent-main)] leading-snug line-clamp-3">
                {post.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className={isSticky ? "sticky top-[120px] z-10" : ""}>
      <CategoryBlock title={blockName} subcategories={subcategories}>
        {renderLayout()}
      </CategoryBlock>
    </div>
  );
}
