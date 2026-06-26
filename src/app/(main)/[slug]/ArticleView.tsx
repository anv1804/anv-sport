import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { AdBanner } from '@/components/shared/ads/AdBanner'
import { createArticleUrl } from '@/lib/helpers/url'
import { ArticleHtmlContent } from './ArticleHtmlContent'
import { Mail, Link as LinkIcon, Bookmark, MessageCircle, Smile, ThumbsUp, Flag } from 'lucide-react'
import { PredictionView } from '@/components/domain/article/PredictionView'
import { unstable_cache } from 'next/cache'
import { ViewTracker } from './ViewTracker'
import { getHotPostIds } from '@/lib/cms-redis'

import { getCachedPost } from '@/lib/content-cache'

const getCachedRelatedData = unstable_cache(
  async (postId: number, manualRelatedIds: number[], categoryId: string | undefined, takeCount: number, excludeIds: number[]) => {
    return Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', id: { not: postId } },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      manualRelatedIds.length > 0
        ? prisma.post.findMany({
            where: { id: { in: manualRelatedIds } },
            include: { categories: true }
          })
        : Promise.resolve([]),
      categoryId && takeCount > 0
        ? prisma.post.findMany({
            where: { 
              status: 'PUBLISHED', 
              id: { notIn: excludeIds },
              categories: { some: { id: categoryId } }
            },
            orderBy: { createdAt: 'desc' },
            take: takeCount,
            include: { categories: true }
          })
        : takeCount > 0
        ? prisma.post.findMany({
            where: { status: 'PUBLISHED', id: { notIn: excludeIds } },
            orderBy: { createdAt: 'desc' },
            take: takeCount,
            include: { categories: true }
          })
        : Promise.resolve([])
    ])
  },
  ['post-related-data'],
  { revalidate: 60, tags: ['posts'] }
);

export function ArticleView({ id }: { id: string }) {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    notFound();
  }
  return <ArticleContent id={numericId} />
}

async function ArticleContent({ id }: { id: number }) {
  const post = await getCachedPost(id, () => 
    prisma.post.findUnique({
      where: { id },
      include: { categories: true }
    })
  )

  if (!post) {
    notFound()
  }

  // Lấy các bài viết liên quan được chọn thủ công từ metadata
  let parsedMeta: any = {};
  try {
    parsedMeta = post.metadata ? JSON.parse(post.metadata) : {};
  } catch(e) {}

  let manualRelatedIds: number[] = [];
  if (parsedMeta.relatedPosts && Array.isArray(parsedMeta.relatedPosts)) {
    manualRelatedIds = parsedMeta.relatedPosts
      .map((p: any) => parseInt(p.id, 10))
      .filter((id: number) => !isNaN(id) && id !== post.id);
  }

  const excludeIds = [post.id, ...manualRelatedIds];
  const takeCount = Math.max(0, 15 - manualRelatedIds.length);
  const categoryId = post.categories?.[0]?.id;

  const [latestPosts, manualPosts, autoRelatedPosts, hotIds] = await Promise.all([
    getCachedRelatedData(
      post.id,
      manualRelatedIds,
      categoryId,
      takeCount,
      excludeIds
    ).then(r => r[0]),
    getCachedRelatedData(
      post.id,
      manualRelatedIds,
      categoryId,
      takeCount,
      excludeIds
    ).then(r => r[1]),
    getCachedRelatedData(
      post.id,
      manualRelatedIds,
      categoryId,
      takeCount,
      excludeIds
    ).then(r => r[2]),
    getHotPostIds(5),
  ]);

  // Fetch hot posts data nếu có từ Redis
  let hotPosts: any[] = [];
  if (hotIds.length > 0) {
    hotPosts = await prisma.post.findMany({
      where: { id: { in: hotIds }, status: 'PUBLISHED' },
      select: { id: true, title: true },
    });
    // Sort theo thứ tự hotIds
    hotPosts.sort((a, b) => hotIds.indexOf(a.id) - hotIds.indexOf(b.id));
  }
  // Fallback về latestPosts nếu Redis chưa có data
  const sidebarPosts = hotPosts.length > 0 ? hotPosts : latestPosts.slice(0, 5);
  const sidebarTitle = hotPosts.length > 0 ? 'XEM NHIỀU' : 'MỚI NHẤT';

  // Keep manual order
  if (manualRelatedIds.length > 0 && manualPosts.length > 0) {
    manualPosts.sort((a, b) => manualRelatedIds.indexOf(a.id) - manualRelatedIds.indexOf(b.id));
  }

  const relatedPosts = [...manualPosts, ...autoRelatedPosts];

  // Format date
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric'
  }
  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN', dateOptions)

  if (parsedMeta.isPrediction && parsedMeta.predictionData) {
    return <PredictionView post={post} predictionData={parsedMeta.predictionData} />;
  }

  return (
    <>
      {/* Fire-and-forget view tracker: gọi sau 3s, không block render */}
      <ViewTracker postId={post.id} />
      <main className="w-full max-w-[1160px] mx-auto px-4 pt-10 pb-6 md:px-6 md:py-8 font-sans bg-white min-h-screen shadow-[0_0_20px_rgba(0,0,0,0.15)] relative z-20">
      {/* TOP AD BANNER */}
      <div className="mb-6">
        <AdBanner type="leaderboard" adSlot="Article_Top" className="w-full h-[90px] md:h-[120px] bg-slate-100 rounded-lg overflow-hidden" imageUrl="/ad-horizontal.png" />
      </div>

      {/* BREADCRUMB */}
      <div className="flex items-center text-[13px] uppercase tracking-wide border-b border-slate-100 pb-3 mb-6">
        <Link href="/" className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors">THỂ THAO</Link>
        <span className="mx-2 text-slate-300 font-bold">/</span>
        {post.categories && post.categories.length > 0 ? (
          <Link href={`/${post.categories[0].slug}`} className="text-slate-500 hover:text-emerald-600 transition-colors font-medium">
            {post.categories[0].name}
          </Link>
        ) : (
          <span className="text-slate-500 font-medium">BÀI VIẾT</span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative">
        
        {/* LEFT COLUMN (Content) */}
        <article className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-[36px] lg:text-[40px] leading-[1.25] font-black text-slate-900 mb-4 tracking-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center text-[13px] text-slate-500 mb-6 font-medium">
            <span className="capitalize">{formattedDate} (GMT+7)</span>
          </div>
          
          <div className="flex gap-4 md:gap-8 relative">
            {/* VERTICAL SOCIAL SHARE (Desktop) */}
            <div className="hidden md:flex flex-col items-center gap-3 shrink-0 w-10 sticky top-[130px] h-fit">
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors" title="Chia sẻ Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors" title="Chia sẻ Zalo">
                <span className="font-bold text-[12px]">Zalo</span>
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors" title="Gửi Email">
                <Mail size={18} />
              </button>
              <div className="w-5 border-b border-slate-200 my-1"></div>
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors" title="Lưu bài viết">
                <Bookmark size={18} />
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors" title="Bình luận">
                <MessageCircle size={16} />
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors" title="Copy Link">
                <LinkIcon size={18} />
              </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 min-w-0">
              {post.excerpt && (
                <p className="text-[18px] md:text-[20px] font-medium text-slate-700 leading-relaxed mb-6 bg-slate-50 p-4 md:p-5 rounded-r-xl border-l-4 border-emerald-500 shadow-sm">
                  {post.excerpt}
                </p>
              )}

              {/* HORIZONTAL SOCIAL SHARE (Mobile only) */}
              <div className="flex md:hidden flex-wrap items-center gap-2 mb-6 pb-6 border-b border-slate-100">
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </button>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-[10px]">Zalo</span>
                </button>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <Mail size={14} />
                </button>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <LinkIcon size={14} />
                </button>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <Bookmark size={14} />
                </button>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                  <MessageCircle size={14} />
                </button>
              </div>

              <ArticleHtmlContent 
                html={post.content} 
                thumbnailUrl={post.imageUrl} 
                title={post.title} 
              />

              {/* AUTHOR */}
              <div className="flex justify-end mt-8 pt-4">
                <p className="font-bold text-slate-900 text-lg">{post.author || 'ANV SPORT'}</p>
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-slate-100 gap-4">
                {/* Left Side: Back & Save */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link href="/" className="w-10 h-10 border border-slate-200 rounded flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  </Link>
                  <button className="px-4 h-10 border border-slate-200 rounded flex items-center gap-2 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors font-medium group">
                    <Bookmark size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" /> Lưu
                  </button>
                </div>

                {/* Right Side: Google News & Shares */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pb-2 sm:pb-0">
                  <a href="#" className="px-3 sm:px-4 h-10 rounded-full border border-slate-200 text-[12px] sm:text-[13px] text-slate-600 hover:bg-slate-50 transition-colors flex items-center">
                    Theo dõi ANV Sport trên <span className="font-bold text-blue-500 ml-1">G</span><span className="font-bold text-red-500">o</span><span className="font-bold text-yellow-500">o</span><span className="font-bold text-blue-500">g</span><span className="font-bold text-green-500">l</span><span className="font-bold text-red-500">e</span> News
                  </a>
                  <div className="flex items-center gap-2">
                    <button className="w-10 h-10 rounded-full border border-slate-200 flex shrink-0 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </button>
                    <button className="w-10 h-10 rounded-full border border-slate-200 flex shrink-0 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                      <Mail size={16} />
                    </button>
                    <button className="w-10 h-10 rounded-full border border-slate-200 flex shrink-0 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                      <LinkIcon size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* TAGS */}
              <div className="flex items-center flex-wrap gap-2 mt-8">
                <span className="text-slate-500 font-bold text-[13px] uppercase tracking-wide mr-2 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  Từ khóa:
                </span>
                <a href="#" className="text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-md">Mexico</a>
                <a href="#" className="text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-md">Mỹ</a>
                <a href="#" className="text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-md">World Cup 2026</a>
                <a href="#" className="text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-md">vịt Merlin</a>
              </div>

              {/* BOTTOM AD BANNER */}
              <div className="mt-8 mb-8">
                <div className="border border-slate-200 p-1 rounded bg-white">
                  <AdBanner type="leaderboard" adSlot="Article_Bottom" className="w-full h-[150px] md:h-[250px] bg-slate-100 overflow-hidden" imageUrl="/ad-horizontal.png" />
                </div>
              </div>

              {/* COMMENTS SECTION */}
              <div className="mt-10 pt-8">
                <div className="border-b border-emerald-100 mb-6 flex">
                  <h3 className="text-[18px] md:text-[20px] font-black text-emerald-600 uppercase tracking-tight border-b-2 border-emerald-600 pb-2 -mb-[1px]">
                    Ý kiến <span className="text-emerald-500 font-bold text-[16px] md:text-[18px] ml-1">(1)</span>
                  </h3>
                </div>
                
                {/* Input box */}
                <div className="flex gap-3 mb-8">
                  <div className="flex-1 border border-slate-200 rounded flex items-center px-4 py-3 bg-slate-50 focus-within:border-emerald-500 focus-within:bg-white transition-colors">
                    <input type="text" placeholder="Chia sẻ ý kiến của bạn" className="flex-1 bg-transparent outline-none text-[15px] text-slate-800 placeholder-slate-500" />
                    <button className="text-slate-400 hover:text-emerald-600 transition-colors ml-2" title="Thêm emoji">
                      <Smile size={20} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200 mb-8">
                  <button className="text-emerald-600 font-bold text-[15px] pb-3 border-b-2 border-emerald-600">Quan tâm nhất</button>
                  <button className="text-slate-400 font-medium text-[15px] pb-3 hover:text-slate-600 transition-colors">Mới nhất</button>
                </div>

                {/* Comment List */}
                <div className="space-y-6">
                  {/* Single Comment */}
                  <div className="flex gap-3">
                    <img src="https://i.pravatar.cc/150?u=a04258" alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 text-[15px]">Bác Vũ</h4>
                      </div>
                      <p className="text-[15px] text-slate-700 mb-2.5 leading-relaxed">
                        Thật thú vị 1 chú vịt mùa Worldcup<br />Chỗ chúng tôi đang mùa Sấu thiếu 1 chút thú vị !
                      </p>
                      <div className="flex items-center gap-4 text-[13px] text-slate-500 font-medium">
                        <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors"><ThumbsUp size={14} /> Thích</button>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100"><span className="text-sm">😆👍</span> 3</span>
                        <button className="hover:text-emerald-600 transition-colors">Trả lời</button>
                        <button className="hover:text-red-600 transition-colors flex items-center gap-1" title="Báo cáo vi phạm"><Flag size={14} /></button>
                        <span className="ml-auto text-slate-400 font-normal">1h trước</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TIN LIÊN QUAN */}
              {relatedPosts.length > 0 && (
                <div className="mt-12 pt-8">
                  <div className="border-b border-emerald-100 mb-6 flex">
                    <h3 className="text-[18px] md:text-[20px] font-black text-emerald-600 uppercase tracking-tight border-b-2 border-emerald-600 pb-2 -mb-[1px]">
                      TIN CÙNG CHUYÊN MỤC
                    </h3>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    {relatedPosts.map((rp) => (
                      <div key={rp.id} className="flex flex-col sm:flex-row gap-5 group border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                        <Link href={createArticleUrl(rp.title, rp.id)} className="w-full sm:w-[240px] md:w-[280px] shrink-0 block overflow-hidden rounded-lg relative group">
                          <img 
                            src={rp.imageUrl || '/placeholder.jpg'} 
                            alt={rp.title} 
                            className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {rp.imageUrl && (
                            <img src="/icons/anv-sport-icon.png" alt="" className="absolute bottom-2 right-2 w-5 h-5 object-contain opacity-50 transition-opacity duration-300 pointer-events-none z-10 select-none group-hover:opacity-80" />
                          )}
                        </Link>
                        
                        <div className="flex flex-col flex-1 py-1">
                          <Link href={createArticleUrl(rp.title, rp.id)}>
                            <h4 className="font-bold text-[17px] md:text-[20px] text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors mb-2 line-clamp-3 md:line-clamp-2">
                              {rp.title}
                            </h4>
                          </Link>
                          
                          {rp.excerpt && (
                            <p className="text-[14px] md:text-[15px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                              {rp.excerpt}
                            </p>
                          )}
                          
                          <div className="mt-auto flex items-center gap-3 text-[12px] text-slate-400 font-medium w-full">
                            {rp.categories && rp.categories.length > 0 && (
                              <span className="text-emerald-600 uppercase font-bold tracking-wider">{rp.categories[0].name}</span>
                            )}
                            <span className="flex items-center gap-1 ml-auto">
                              {new Date(rp.publishedAt || rp.createdAt).toLocaleDateString('vi-VN')} {new Date(rp.publishedAt || rp.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Nút Xem thêm */}
                  <div className="mt-8 text-center border-t border-slate-100 pt-8">
                    <button className="px-8 py-2.5 rounded-full border-2 border-emerald-500 text-emerald-600 font-bold hover:bg-emerald-500 hover:text-white transition-colors text-[14px] uppercase tracking-wider">
                      Xem thêm tin
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* RIGHT COLUMN (Sidebar) */}
        <aside className="w-full lg:w-[320px] shrink-0">
          <div className="sticky top-[130px] space-y-8">
            {/* AD BANNER */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 block">Quảng cáo</span>
              <AdBanner type="rectangle" adSlot="Right_Sidebar_Top" className="h-[250px] w-full mx-auto" imageUrl="/ad-rectangle.png" />
            </div>
          
          {/* SIDEBAR: XEM NHIỀU / MỚI NHẤT */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-slate-100">
               <div className="w-2 h-5 bg-emerald-500 rounded-full"></div>
               <h3 className="font-black text-lg text-slate-900 uppercase tracking-wide">
                 {sidebarTitle}
               </h3>
            </div>
            <div className="space-y-4">
              {sidebarPosts.map((p, idx) => (
                <div key={p.id} className="flex gap-4 items-start group">
                  <span className="text-3xl font-black text-slate-200 group-hover:text-emerald-500 transition-colors leading-none mt-1">
                    {idx + 1}
                  </span>
                  <Link href={createArticleUrl(p.title, p.id)} className="font-semibold text-[15px] text-slate-800 hover:text-emerald-600 line-clamp-3 leading-snug transition-colors">
                    {p.title}
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center hidden lg:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 block">Quảng cáo</span>
            <AdBanner type="rectangle" adSlot="Right_Sidebar_Bottom" className="h-[600px] w-full mx-auto" imageUrl="/ad-rectangle.png" />
          </div>
        </div>
      </aside>
      
    </div>
    </main>
    </>
  );
}
