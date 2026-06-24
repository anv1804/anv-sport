'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createArticleUrl } from '@/lib/helpers/url'
import { loadMoreCategoryPosts } from '@/app/actions/category'

type PostDisplay = {
  id: number
  title: string
  excerpt: string | null
  imageUrl: string | null
  slug: string
  createdAt?: Date | string
}

interface CategoryFeedProps {
  initialPosts: PostDisplay[]
  categoryIds: string[]
  totalPosts: number
  isFirstPage: boolean
  currentPage: number
}

export function CategoryFeed({ 
  initialPosts, 
  categoryIds, 
  totalPosts, 
  isFirstPage,
  currentPage
}: CategoryFeedProps) {
  const [posts, setPosts] = useState<PostDisplay[]>(initialPosts)
  const [loading, setLoading] = useState(false)

  const offset = (currentPage - 1) * 15 + (isFirstPage ? 7 : 0) + posts.length
  const hasMore = offset < totalPosts

  const handleLoadMore = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const newPosts = await loadMoreCategoryPosts(categoryIds, offset, 5)
      if (newPosts.length > 0) {
        setPosts(prev => [...prev, ...newPosts])
      }
    } catch (error) {
      console.error('Failed to load more posts', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-6">
        {posts.map((post, idx) => (
          <div key={`${post.id}-${idx}`} className="flex flex-col sm:flex-row gap-5 group border-b border-slate-100 pb-6 last:border-0 last:pb-0">
            <Link href={createArticleUrl(post.title, post.id)} className="w-full sm:w-[240px] md:w-[280px] shrink-0 block overflow-hidden rounded-lg relative group">
              <img 
                src={post.imageUrl || '/placeholder.jpg'} 
                alt={post.title} 
                className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {post.imageUrl && (
                <img src="/icons/anv-sport-icon.png" alt="" className="absolute bottom-2 right-2 w-5 h-5 object-contain opacity-50 transition-opacity duration-300 pointer-events-none z-10 select-none group-hover:opacity-80" />
              )}
            </Link>
            
            <div className="flex flex-col flex-1 py-1">
              <Link href={createArticleUrl(post.title, post.id)}>
                <h4 className="font-bold text-[17px] md:text-[20px] text-slate-900 leading-snug group-hover:text-[var(--color-accent-main)] transition-colors mb-2 line-clamp-3 md:line-clamp-2">
                  {post.title}
                </h4>
              </Link>
              
              {post.excerpt && (
                <p className="text-[14px] md:text-[15px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {post.excerpt}
                </p>
              )}
              
              <div className="mt-auto flex items-center text-[12px] text-slate-400 font-medium w-full">
                {post.createdAt && (
                  <span className="flex items-center gap-1 ml-auto">
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')} {new Date(post.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-6 mt-6">
          {[1, 2, 3].map((n) => (
            <div key={`skeleton-${n}`} className="flex flex-col sm:flex-row gap-5 border-b border-slate-100 pb-6 last:border-0 last:pb-0 animate-pulse">
              <div className="w-full sm:w-[240px] md:w-[280px] aspect-[16/10] bg-slate-200 rounded-lg shrink-0"></div>
              <div className="flex flex-col flex-1 py-1 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-5/6"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/4 mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Chưa có bài viết nào trong mục này.
        </div>
      )}

      {/* Nút Xem Thêm (Chỉ hiển thị trên Mobile) */}
      {hasMore && (
        <div className="mt-6 text-center md:hidden">
          <button 
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải...
              </>
            ) : (
              'Xem thêm'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
