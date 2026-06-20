'use client'

import React, { useEffect, useRef, useState } from 'react'
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

interface Props {
  html: string
  thumbnailUrl?: string | null
  title: string
}

export function ArticleHtmlContent({ html, thumbnailUrl, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [images, setImages] = useState<{ src: string }[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    
    // Tìm tất cả các thẻ img trong bài viết (bao gồm cả thumbnail)
    const imgElements = Array.from(containerRef.current.querySelectorAll('img'))
    const imgSrcs = imgElements.map(img => ({ src: img.src }))
    setImages(imgSrcs)

    // Lắng nghe sự kiện click
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLImageElement
      if (target.tagName === 'IMG') {
        const index = imgElements.indexOf(target)
        if (index !== -1) {
          setCurrentIndex(index)
          setOpen(true)
        }
      }
    }

    // Gắn sự kiện (Event Delegation)
    const container = containerRef.current
    container.addEventListener('click', handleImageClick)

    // Đổi con trỏ chuột thành hình kính lúp
    imgElements.forEach(img => {
      img.style.cursor = 'zoom-in'
    })

    return () => {
      container.removeEventListener('click', handleImageClick)
    }
  }, [html, thumbnailUrl])

  const hasThumbnailInContent = thumbnailUrl ? html.includes(thumbnailUrl) : false;

  return (
    <>
      <div ref={containerRef}>
        {thumbnailUrl && !hasThumbnailInContent && (
          <figure className="mb-8">
            <img src={thumbnailUrl} alt={title} className="w-full h-auto rounded-lg object-cover bg-slate-100" />
          </figure>
        )}
        
        <div 
          className="prose prose-lg max-w-none prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-emerald-600 hover:prose-a:text-emerald-700 prose-img:rounded-xl prose-headings:font-bold prose-headings:text-slate-900 mb-10"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      
      {images.length > 0 && (
        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={currentIndex}
          slides={images}
          carousel={{ finite: false }}
        />
      )}
    </>
  )
}
