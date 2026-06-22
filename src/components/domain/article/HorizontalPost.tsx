import Link from "next/link";
import React from "react";

interface HorizontalPostProps {
  href?: string;
  title?: string;
  excerpt?: string;
  imageUrl?: string;
  imageClass?: string;
  size?: "sm" | "md" | "lg" | "hero";
  titlePosition?: "side" | "top";
  hideImage?: boolean;
  hideExcerpt?: boolean;
  isLive?: boolean;
  category?: string;
  className?: string;
  isLoading?: boolean;
  titleLines?: number;
  excerptLines?: number;
}

export function HorizontalPost({
  href = "#",
  title = "",
  excerpt = "",
  imageUrl,
  imageClass = "w-[140px]",
  size = "md",
  titlePosition = "side",
  hideImage = false,
  hideExcerpt = false,
  isLive = false,
  category,
  className = "",
  isLoading = false,
  titleLines = 4,
  excerptLines = 2,
}: HorizontalPostProps) {

  if (isLoading) {
    if (titlePosition === "top") {
       return (
         <div className={`block w-full ${className}`}>
            <div className="w-3/4 h-5 bg-gray-200 animate-pulse rounded mb-3"></div>
            <div className="flex items-start">
               <div className={`bg-gray-200 flex-shrink-0 animate-pulse aspect-[5/3] mr-4 ${imageClass}`}></div>
               <div className="flex-1 space-y-2">
                 <div className="w-full h-4 bg-gray-100 animate-pulse rounded"></div>
                 <div className="w-5/6 h-4 bg-gray-100 animate-pulse rounded"></div>
               </div>
            </div>
         </div>
       )
    }
    return (
      <div className={`flex items-start w-full ${className}`}>
        <div className={`bg-gray-200 flex-shrink-0 animate-pulse aspect-[5/3] mr-4 md:mr-5 ${imageClass}`}></div>
        <div className="flex-1 flex flex-col">
           <div className="w-full h-5 bg-gray-200 animate-pulse rounded mb-2"></div>
           <div className="w-2/3 h-5 bg-gray-200 animate-pulse rounded mb-3"></div>
           {!hideExcerpt && (
             <div className="space-y-2">
               <div className="w-full h-4 bg-gray-100 animate-pulse rounded"></div>
               <div className="w-5/6 h-4 bg-gray-100 animate-pulse rounded"></div>
             </div>
           )}
        </div>
      </div>
    );
  }

  // Title Size Mapping
  const titleSizeMap = {
    sm: "text-[14px]",
    md: "text-[16px]",
    lg: "text-[18px]",
    hero: "text-[24px]", // For top hero post
  };

  const clampMap: Record<number, string> = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
    4: "line-clamp-4",
    5: "line-clamp-5",
  };

  const titleStyles = `${titleSizeMap[size]} font-bold text-[#222222] leading-[1.4] group-hover:text-[var(--color-accent-main)] transition-colors ${titleLines && clampMap[titleLines] ? clampMap[titleLines] : ''}`;

  const TitleElement = () => (
    <div className={`w-full ${titlePosition === "top" ? "mb-2" : "mb-2"}`}>
      <h3 className={titleStyles}>
        {isLive && (
          <span className="text-[var(--color-accent-main)] text-[13px] font-bold mr-2 uppercase">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent-main)] mr-1 align-middle relative -top-[1px]"></span>
            Live
          </span>
        )}
        {category && (
          <span className="block text-[var(--color-accent-main)] text-[13px] font-bold mb-1 uppercase tracking-wide">
            {category}
          </span>
        )}
        {title}
      </h3>
    </div>
  );

  const ImageElement = () => {
    if (hideImage) return null;
    return (
      <div className={`bg-[#e5e5e5] flex-shrink-0 relative overflow-hidden aspect-[5/3] ${titlePosition === "side" ? "mr-4 md:mr-5" : "mr-4"} ${imageClass}`}>
        {imageUrl ? (
           <img src={imageUrl} alt={title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
           <div className="absolute inset-0 bg-[#e5e5e5] transition-transform duration-500 group-hover:scale-105"></div>
        )}
      </div>
    );
  };

  const ExcerptElement = () => {
    if (hideExcerpt || !excerpt) return null;
    return (
      <p className={`text-[14px] text-[#4f4f4f] leading-[1.5] w-full ${excerptLines && clampMap[excerptLines] ? clampMap[excerptLines] : ''}`}>
        {excerpt}
      </p>
    );
  };

  // Layout Side: Image Left, Title + Excerpt Right
  if (titlePosition === "side") {
    return (
      <Link href={href} className={`flex items-start group cursor-pointer w-full ${className}`}>
        <ImageElement />
        <div className="flex-1 flex flex-col min-w-0">
          <TitleElement />
          <ExcerptElement />
        </div>
      </Link>
    );
  }

  // Layout Top: Title Top, Image Left, Excerpt Right
  return (
    <Link href={href} className={`block group cursor-pointer w-full ${className}`}>
      <TitleElement />
      <div className="flex items-start">
        <ImageElement />
        <div className="flex-1 min-w-0">
          <ExcerptElement />
        </div>
      </div>
    </Link>
  );
}
