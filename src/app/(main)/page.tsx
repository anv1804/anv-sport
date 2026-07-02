import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ANV Sport - Tin tức thể thao 24h, Bóng đá, Đua xe',
  description: 'Trang thông tin tổng hợp thể thao hàng đầu Việt Nam. Cập nhật nhanh chóng, chính xác tin tức bóng đá, tennis, võ thuật.',
};

export const revalidate = 30; // Cache homepage for 30 seconds (ISR) for ultra-fast loading

import { MatchScheduleSlider } from "@/components/shared/widgets/MatchScheduleSlider";
import { AdBanner } from "@/components/shared/ads/AdBanner";
import {
  HeroSection,
  MainContentSection,
  SportsTechSection,
  MediaSection,
  BottomSection,
} from "@/components/domain/homepage";
import prisma from '@/lib/prisma';
import { PageSettings } from '@/types/page';
import { unstable_cache } from 'next/cache';

const getCachedHomepageData = unstable_cache(
  async () => {
    const homePage = await prisma.page.findUnique({ where: { slug: '/' } });
    let settings: PageSettings = {};
    try { settings = JSON.parse(homePage?.settings || '{}'); } catch (e) {}

    const topValue = settings.top_section;

    // Phân biệt: category:<id> → lấy bài từ chuyên mục; còn lại → tìm Zone
    const isCategory = topValue?.startsWith('category:');

    let topZone: any = null;
    let topPostsFromCategory: any[] = [];

    if (isCategory) {
      // Lấy bài mới nhất từ Category (hoặc con của nó)
      const categoryId = topValue!.replace('category:', '');
      const posts = await prisma.post.findMany({
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
        take: 3,
        select: { id: true, title: true, excerpt: true, imageUrl: true, createdAt: true, isAiGenerated: true, status: true }
      });
      topPostsFromCategory = posts;
    } else {
      topZone = topValue
        ? await prisma.zone.findUnique({
            where: { id: topValue },
            include: {
              zonePosts: {
                orderBy: { position: 'asc' },
                take: 3,
                include: { post: { select: { id: true, title: true, excerpt: true, imageUrl: true, createdAt: true, isAiGenerated: true, status: true } } }
              }
            }
          })
        : await prisma.zone.findFirst({
            where: { page: { slug: '/' }, isActive: true },
            orderBy: { createdAt: 'desc' },
            include: {
              zonePosts: {
                orderBy: { position: 'asc' },
                take: 3,
                include: { post: { select: { id: true, title: true, excerpt: true, imageUrl: true, createdAt: true, isAiGenerated: true, status: true } } }
              }
            }
          });
    }

    return { settings, topZone, topPostsFromCategory };
  },
  ['homepage-data-cache'],
  { revalidate: 30, tags: ['homepage'] }
);

export default async function Home() {
  // Fetch cached settings and top zone
  const { settings, topZone, topPostsFromCategory } = await getCachedHomepageData();

  const topPosts = topPostsFromCategory.length > 0
    ? topPostsFromCategory
    : (topZone?.zonePosts.map((zp: any) => zp.post) || []);
  const mainPost = topPosts.length > 0 ? topPosts[0] : null;
  const subPosts = topPosts.length > 1 ? topPosts.slice(1, 3) : [];

  return (
    <div
      className="w-full bg-[#111111] bg-no-repeat relative pt-0 md:pt-[40px]"
      style={{
        backgroundImage: "url('/bg-ads-full.png')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Clickable Area for the Takeover Ad (Sides) */}
      <a href="mailto:nguyenan18404@gmail.com" className="absolute inset-0 w-full h-full z-10 block">
        <span className="sr-only">Liên hệ quảng cáo VIP: nguyenan18404@gmail.com - 0965 064 241</span>
      </a>

      {/* NỘI DUNG CHÍNH (Nổi trên nền Quảng cáo) */}
      <main className="w-full max-w-[1160px] mx-auto px-4 py-4 md:px-6 md:py-4 md:py-6 font-sans bg-white relative z-20 shadow-[0_0_20px_rgba(0,0,0,0.15)] min-h-screen">
        <h1 className="sr-only">ANV SPORT - Chuyên trang thể thao hàng đầu Việt Nam</h1>

        <HeroSection
          mainPost={mainPost}
          subPosts={subPosts}
          adTopRightSlot={settings.ad_top_right}
        />

        <MatchScheduleSlider />

        <MainContentSection
          newsFeedZoneId={settings.news_feed}
          categoryBlocks={settings.category_blocks}
        />

        <SportsTechSection />

        {/* HUGE BANNER AD */}
        <div className="mb-4 md:mb-6">
          <AdBanner type="leaderboard" className="h-[120px] md:h-[200px] !max-w-[1000px] mx-auto" adSlot={settings.ad_middle || "Middle_FullWidth_Ad"} imageUrl="/ad-leaderboard.png" />
        </div>

        <MediaSection />

        <BottomSection adBottomRightSlot={settings.ad_bottom_right} />

      </main>
    </div>
  );
}
