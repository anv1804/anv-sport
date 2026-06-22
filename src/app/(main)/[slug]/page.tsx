import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { HorizontalPost } from "@/components/domain/article/HorizontalPost"
import { VerticalPost } from "@/components/domain/article/VerticalPost"
import { AdBanner } from "@/components/shared/ads/AdBanner"
import Link from 'next/link'
import { ArticleView } from './ArticleView'
import { createArticleUrl } from '@/lib/helpers/url'
import { CategoryFeed } from '@/components/domain/category/CategoryFeed'

export default async function SlugPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const { slug } = resolvedParams
  const resolvedSearchParams = await searchParams
  const pageParam = resolvedSearchParams.page
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) || 1 : 1

  if (slug.endsWith('.html')) {
    const match = slug.match(/-([^-]+)\.html$/)
    if (match) {
      return <ArticleView id={match[1]} />
    }
  }

  return <CategoryContent categorySlug={slug} page={page} />
}

async function CategoryContent({ categorySlug, page }: { categorySlug: string, page: number }) {
  // 1. Fetch category with parent and children
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: {
      parent: {
        include: {
          children: true
        }
      },
      children: true
    }
  })

  if (!category) {
    notFound()
  }

  // Build breadcrumb items based on category structure
  const navItems = []
  if (category.parentId && category.parent) {
    // Current category is a child
    navItems.push({ name: category.parent.name, slug: category.parent.slug })
    const siblings = category.parent.children.filter(c => c.id !== category.id)
    siblings.forEach(c => {
      navItems.push({ name: c.name, slug: c.slug })
    })
  } else {
    // Current category is a parent
    category.children.forEach(c => {
      navItems.push({ name: c.name, slug: c.slug })
    })
  }

  // 2. Fetch posts for this category ONLY
  const categoryIdsToFetch = [category.id]

  const isFirstPage = page === 1

  const totalPosts = await prisma.post.count({
    where: {
      status: 'PUBLISHED',
      categories: {
        some: {
          id: { in: categoryIdsToFetch }
        }
      }
    }
  })

  const rawPosts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      categories: {
        some: {
          id: { in: categoryIdsToFetch }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip: (page - 1) * 15,
    take: 15
  })

  const posts = rawPosts.map(post => ({
    ...post,
    slug: (post as any).slug || post.id.toString(),
  }))

  let heroPost = null
  let topRightPosts: any[] = []
  let middleRowPosts: any[] = []
  let feedPosts: any[] = []

  if (isFirstPage) {
    heroPost = posts.length > 0 ? posts[0] : null
    topRightPosts = posts.slice(1, 3)
    middleRowPosts = posts.slice(3, 7)
    feedPosts = posts.slice(7)
  } else {
    feedPosts = posts
  }

  const totalPages = Math.ceil(totalPosts / 15)

  return (
    <div className="w-full bg-[#111111] bg-no-repeat relative pt-0 md:pt-[20px]" style={{ backgroundImage: "url('/bg-ads-full.png')", backgroundSize: "cover", backgroundPosition: "top center", backgroundAttachment: "fixed" }}>
      <main className="w-full max-w-[1160px] mx-auto px-4 py-4 md:px-6 md:py-4 md:py-6 font-sans bg-white relative z-20 shadow-[0_0_20px_rgba(0,0,0,0.15)] min-h-screen">
        
        {/* Lịch thi đấu giả lập (Phần trên cùng của VNE) */}
        <div className="mb-4 text-center">
          <img src="https://s1.vnecdn.net/vnexpress/restruct/i/v956/v2_2019/pc/graphics/bg-worldcup-2026.jpg" alt="Banner" className="w-full h-auto object-cover rounded-lg hidden" />
          {/* Để mô phỏng, ta sẽ coi banner là một AdBanner hoặc hình ảnh */}
        </div>

        {/* Header Chuyên Mục & Menu ngang */}
        <div className="border-b border-slate-200 mb-4 pb-2">
          <div className="flex items-end gap-4 md:gap-6 mb-2">
            <h1 className="text-3xl font-bold text-[var(--color-accent-main)] capitalize tracking-tight">
              {category.name}
            </h1>
            <nav className="flex items-center gap-4 text-[15px] font-medium text-[#757575] pb-1 flex-wrap">
              {navItems.map((item, idx) => (
                <Link key={idx} href={`/${item.slug}`} className="hover:text-[var(--color-accent-main)] transition-colors">
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-[var(--color-accent-main)] bg-slate-50 py-2 px-3 rounded">
            <span className="font-semibold text-[var(--color-accent-main)]">Các giải:</span>
            <Link href="#" className="hover:text-[var(--color-accent-main)]">World Cup 2026</Link>
            <Link href="#" className="hover:text-[var(--color-accent-main)]">V-League</Link>
            <Link href="#" className="hover:text-[var(--color-accent-main)]">Ngoại hạng Anh</Link>
            <Link href="#" className="hover:text-[var(--color-accent-main)]">La Liga</Link>
            <Link href="#" className="hover:text-[var(--color-accent-main)]">Champions League</Link>
          </div>
        </div>

        {/* 1. KHU VỰC TIÊU ĐIỂM BÊN TRÊN (Hero + 2 Top Right) */}
        {isFirstPage && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {/* Cột trái lớn (Hero Image Overlay) */}
            <div className="lg:col-span-2 relative group cursor-pointer overflow-hidden rounded">
              {heroPost ? (
                <Link href={createArticleUrl(heroPost.title, heroPost.id)} className="block h-full relative">
                  <img 
                    src={heroPost.imageUrl || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop'} 
                    alt={heroPost.title} 
                    className="w-full h-[380px] object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="text-2xl font-bold text-white leading-tight mb-2 group-hover:text-[var(--color-accent-main)] transition-colors">
                      {heroPost.title}
                    </h2>
                    <p className="text-slate-200 text-sm line-clamp-2">
                      {heroPost.excerpt}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="w-full h-[380px] bg-gray-100 flex items-center justify-center text-gray-500">
                  Chưa có bài viết
                </div>
              )}
            </div>

            {/* Cột phải (2 Bài viết) */}
            <div className="lg:col-span-1 flex flex-col justify-between gap-4 md:gap-5">
              {topRightPosts.map((post, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <Link href={createArticleUrl(post.title, post.id)}>
                    <img src={post.imageUrl || 'https://images.unsplash.com/photo-1518605368461-1ee712cdfc5d?q=80&w=600&auto=format&fit=crop'} alt={post.title} className="w-full h-[140px] object-cover mb-2 rounded" />
                    <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-[var(--color-accent-main)] transition-colors mb-1">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 leading-snug">
                      {post.excerpt}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. DÃY 4 BÀI VIẾT NẰM NGANG */}
        {isFirstPage && middleRowPosts.length > 0 && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 md:pb-6 mb-4 md:mb-6 border-b border-[#e5e5e5]">
            {middleRowPosts.map((post, idx) => (
              <div key={idx} className="group cursor-pointer">
                <Link href={createArticleUrl(post.title, post.id)}>
                  <img src={post.imageUrl || 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=400&auto=format&fit=crop'} alt={post.title} className="w-full h-[120px] object-cover mb-2 rounded" />
                  <h3 className="font-bold text-slate-800 text-[15px] leading-snug group-hover:text-[var(--color-accent-main)] transition-colors">
                    {post.title}
                  </h3>
                </Link>
              </div>
            ))}
          </section>
        )}

        {/* 3. KHU VỰC FEED & SIDEBAR */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          
          {/* Bên trái: Luồng tin tức Feed bằng Client Component */}
          <div className="lg:col-span-8">
            <CategoryFeed 
              initialPosts={feedPosts}
              categoryIds={categoryIdsToFetch}
              totalPosts={totalPosts}
              isFirstPage={isFirstPage}
              currentPage={page}
            />

            {/* Pagination Desktop */}
            {totalPages > 1 && (
              <div className="hidden md:flex justify-center items-center gap-2 mt-8 border-t border-slate-100 pt-6">
                {page > 1 && (
                  <Link 
                    href={`/${category.slug}?page=${page - 1}`}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 hover:text-[var(--color-accent-main)] transition-colors text-sm font-medium"
                  >
                    Trang trước
                  </Link>
                )}
                
                {(() => {
                  let start = Math.max(1, page - 2);
                  let end = Math.min(totalPages, page + 2);
                  if (end - start < 4) {
                    if (start === 1) end = Math.min(totalPages, start + 4);
                    else if (end === totalPages) start = Math.max(1, end - 4);
                  }
                  const pages = [];
                  for (let i = start; i <= end; i++) pages.push(i);
                  
                  return pages.map(pageNum => (
                    <Link
                      key={pageNum}
                      href={`/${category.slug}?page=${pageNum}`}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        pageNum === page 
                          ? 'bg-[var(--color-accent-main)] text-white border border-[var(--color-accent-main)]' 
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[var(--color-accent-main)]'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))
                })()}

                {page < totalPages && (
                  <Link 
                    href={`/${category.slug}?page=${page + 1}`}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 hover:text-[var(--color-accent-main)] transition-colors text-sm font-medium"
                  >
                    Trang sau
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Bên phải: Sidebar Box chức năng */}
          <div className="lg:col-span-4">
            
            {/* Box World Cup 2026 */}
            <div className="bg-[#f8fcfd] border border-cyan-100 rounded-lg overflow-hidden mb-4 md:mb-6">
              <div className="bg-[url('https://s1.vnecdn.net/vnexpress/restruct/i/v956/v2_2019/pc/graphics/bg-worldcup-2026.jpg')] bg-cover bg-center p-3 text-white flex justify-between items-center">
                <span className="font-bold uppercase tracking-wider text-sm">WORLD CUP 2026</span>
              </div>
              <div className="p-4">
                {/* Hero của Box */}
                <div className="mb-4 pb-4 border-b border-cyan-50">
                  <img src="https://images.unsplash.com/photo-1553775282-20af80779df7?q=80&w=400&auto=format&fit=crop" alt="Messi" className="w-full h-[180px] object-cover rounded mb-2" />
                  <h4 className="font-bold text-lg text-slate-800 hover:text-[var(--color-accent-main)] cursor-pointer mb-1">
                    Veron: 'Messi cần phải để đồng đội giúp sức'
                  </h4>
                  <p className="text-sm text-slate-600 line-clamp-2">Cựu tiền vệ Juan Sebastian Veron cho rằng Argentina không thể kỳ vọng Lionel Messi tái hiện hành trình thần kỳ...</p>
                </div>
                
                {/* 3 Bài nhỏ trong Box */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <img src="https://images.unsplash.com/photo-1574629810360-7efbf5ce0010?q=80&w=200&auto=format&fit=crop" alt="Neymar" className="w-full h-[80px] object-cover rounded mb-1" />
                    <h5 className="font-semibold text-xs text-slate-800 hover:text-[var(--color-accent-main)] cursor-pointer">Neymar bị chỉ trích dù chưa thi đấu ở World Cup 2026</h5>
                  </div>
                  <div>
                    <img src="https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=200&auto=format&fit=crop" alt="Tim Weah" className="w-full h-[80px] object-cover rounded mb-1" />
                    <h5 className="font-semibold text-xs text-slate-800 hover:text-[var(--color-accent-main)] cursor-pointer">Tiền đạo Man Utd giúp Bờ Biển Ngà thắng phút chót ở World Cup 2026</h5>
                  </div>
                  <div>
                    <img src="https://images.unsplash.com/photo-1518091043644-c1d44579d2c1?q=80&w=200&auto=format&fit=crop" alt="Match" className="w-full h-[80px] object-cover rounded mb-1" />
                    <h5 className="font-semibold text-xs text-slate-800 hover:text-[var(--color-accent-main)] cursor-pointer">Gyokeres, Isak giúp Thụy Điển đại thắng ở World Cup 2026</h5>
                  </div>
                </div>
              </div>
            </div>

            {/* Box Highlight Ngoại Hạng Anh */}
            <div className="mb-4 md:mb-6">
              <h3 className="text-lg font-bold text-[#861234] border-b-2 border-[#861234] pb-2 mb-4 inline-block">
                Highlight Ngoại hạng Anh
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-[120px] shrink-0 relative">
                    <img src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=200&auto=format&fit=crop" alt="Highlight" className="w-full h-[80px] object-cover rounded" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                       <span className="bg-red-600 text-white rounded-full p-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"/></svg></span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm hover:text-[var(--color-accent-main)] cursor-pointer">
                    Brighton 0-3 Man City: De Bruyne rực sáng
                  </h4>
                </div>
                <div className="flex gap-3">
                  <div className="w-[120px] shrink-0 relative">
                    <img src="https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=200&auto=format&fit=crop" alt="Highlight" className="w-full h-[80px] object-cover rounded" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                       <span className="bg-red-600 text-white rounded-full p-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z"/></svg></span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm hover:text-[var(--color-accent-main)] cursor-pointer">
                    Arsenal 2-1 Everton: Pháo thủ áp sát ngôi vương
                  </h4>
                </div>
              </div>
            </div>

            {/* Banner QC */}
            <div>
              <AdBanner type="rectangle" className="h-[250px] bg-slate-100" />
            </div>

          </div>
        </section>

      </main>
    </div>
  )
}
