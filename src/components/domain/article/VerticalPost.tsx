import Link from "next/link";
import React from "react";

interface VerticalPostProps {
  href?: string;
  title?: string;
  excerpt?: string;
  imageUrl?: string;
  imageClass?: string;
  size?: "sm" | "md" | "lg";
  titlePosition?: "top" | "bottom";
  hideExcerpt?: boolean;
  hideImage?: boolean;
  isLive?: boolean;
  category?: string;
  author?: { name: string; avatar?: string };
  className?: string;
  isLoading?: boolean;
  titleLines?: number;
  excerptLines?: number;
}

export function VerticalPost({
  href = "#",
  title = "",
  excerpt = "",
  imageUrl,
  imageClass = "w-full",
  size = "md",
  titlePosition = "bottom",
  hideExcerpt = false,
  hideImage = false,
  isLive = false,
  category,
  author,
  commentsCount,
  className = "",
  isLoading = false,
  titleLines,
  excerptLines = 3,
}: VerticalPostProps) {
  if (isLoading) {
    return (
      <div className={`flex flex-col h-full w-full ${className}`}>
        {titlePosition === "top" ? (
          <div className="w-full mb-3">
            <div className="w-3/4 h-5 bg-gray-200 animate-pulse rounded mb-2"></div>
            <div className="w-1/2 h-5 bg-gray-200 animate-pulse rounded"></div>
            {!hideExcerpt && (
              <div className="space-y-2 mt-2 w-full">
                <div className="w-full h-4 bg-gray-100 animate-pulse rounded"></div>
                <div className="w-5/6 h-4 bg-gray-100 animate-pulse rounded"></div>
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full aspect-[5/3] bg-gray-200 animate-pulse mb-3 ${imageClass}`}></div>
        )}

        <div className={`w-full mt-auto`}>
           {titlePosition === "top" ? (
             !hideImage && <div className={`w-full aspect-[5/3] bg-gray-200 animate-pulse ${imageClass}`}></div>
           ) : (
             <div className="w-full">
               <div className="w-full h-5 bg-gray-200 animate-pulse rounded mb-2"></div>
               <div className="w-2/3 h-5 bg-gray-200 animate-pulse rounded"></div>
             </div>
           )}
        </div>
      </div>
    );
  }

  // Title Size Mapping
  const titleSizeMap = {
    sm: "text-[16px]",
    md: "text-[18px]",
    lg: "text-[22px]",
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
    <div className="w-full mb-1">
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

  const AuthorBlock = () => (
    <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-[#e5e5e5] md:border-t-0 md:pt-0">
      <div className="flex flex-col">
        <span className="text-[14px] text-[#4f4f4f] italic">{author?.name}</span>
        {commentsCount && (
          <div className="flex items-center mt-1 text-[#006cb7] text-[12px]">
             <span className="flex items-center font-bold hover:text-[var(--color-accent-main)] cursor-pointer">
               <svg className="w-[11px] h-[11px] mr-1.5 fill-[#757575]" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
               {commentsCount}
             </span>
          </div>
        )}
      </div>
      <div className="w-[60px] h-[60px] rounded-full bg-[#f2f2f2] relative overflow-hidden grayscale">
         {author?.avatar ? (
            <img src={author.avatar} alt={author.name} loading="lazy" className="w-full h-full object-cover" />
         ) : (
            <div className="w-full h-full bg-[#e5e5e5] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#bdbdbd]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
         )}
      </div>
    </div>
  );

  const ImageElement = ({ extraClass = "" }: { extraClass?: string }) => {
    if (hideImage) return null;
    return (
      <div className={`bg-[#e5e5e5] relative overflow-hidden aspect-[5/3] flex-shrink-0 w-full ${imageClass} ${extraClass}`}>
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
      <p className={`text-[14px] text-[#4f4f4f] leading-[1.5] mt-1 w-full ${excerptLines && clampMap[excerptLines] ? clampMap[excerptLines] : ''}`}>
        {excerpt}
      </p>
    );
  };

  return (
    <Link href={href} className={`flex flex-col group cursor-pointer w-full h-full ${className}`}>
      
      {titlePosition === "top" ? (
        <div className="flex flex-col w-full mb-3">
          <TitleElement />
          <ExcerptElement />
        </div>
      ) : (
        <ImageElement extraClass="mb-3" />
      )}

      <div className={`w-full flex flex-col ${titlePosition === "top" ? "mt-auto" : ""}`}>
        {titlePosition === "top" ? (
          category === "Góc nhìn" && author ? <AuthorBlock /> : <ImageElement />
        ) : (
          <>
            <TitleElement />
            <ExcerptElement />
          </>
        )}
      </div>

    </Link>
  );
}
