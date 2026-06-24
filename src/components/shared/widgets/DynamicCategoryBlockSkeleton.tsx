import React from "react";
import { HorizontalPost } from "@/components/domain/article/HorizontalPost";
import { VerticalPost } from "@/components/domain/article/VerticalPost";

export function DynamicCategoryBlockSkeleton({ index = 0 }: { index?: number }) {
  const layoutType = index % 3;

  const renderLayoutSkeleton = () => {
    if (layoutType === 1) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-1 md:border-r border-[#e5e5e5] md:pr-6 flex flex-col">
            <VerticalPost 
              isLoading={true}
              hideExcerpt={false}
              size="sm" 
              hideImage={true} 
              titlePosition="top" 
              titleLines={3}
              excerptLines={2}
            />
          </div>
          <div className="md:col-span-2">
            <HorizontalPost 
              isLoading={true}
              imageClass="w-[45%] md:w-[48%]" 
              size="md"
              titleLines={3}
              excerptLines={2}
            />
          </div>
        </div>
      );
    }

    if (layoutType === 2) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className={i < 2 ? "md:border-r border-[#e5e5e5] md:pr-6 flex flex-col" : "flex flex-col"}>
              <VerticalPost 
                isLoading={true}
                size="sm"
                titlePosition="bottom"
                hideExcerpt={true}
                titleLines={3}
              />
            </div>
          ))}
        </div>
      );
    }

    // Default Layout 0
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 md:border-r border-[#e5e5e5] md:pr-6">
          <HorizontalPost 
            isLoading={true}
            imageClass="w-[45%] md:w-[48%]" 
            size="md"
            titleLines={3}
            excerptLines={2}
          />
        </div>
        <div className="md:col-span-1 flex flex-col">
          <VerticalPost 
            isLoading={true}
            hideExcerpt={false}
            size="sm" 
            hideImage={true} 
            titlePosition="top" 
            titleLines={3}
            excerptLines={2}
          />
        </div>
      </div>
    );
  };

  const renderListSkeleton = () => {
    return (
      <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-[#e5e5e5]">
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[0, 1, 2].map((n) => (
            <li key={n} className="relative pl-3 md:pl-4 before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-[5px] before:h-[5px] before:bg-gray-200 before:rounded-full">
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="mb-6 animate-pulse">
      {/* Category Block Header skeleton */}
      <div className="border-b-2 border-slate-200 pb-2 mb-4 flex justify-between items-end">
        <div className="h-5 bg-slate-200 rounded w-32"></div>
        <div className="flex gap-4">
          <div className="h-3 bg-slate-200 rounded w-16"></div>
          <div className="h-3 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
      {renderLayoutSkeleton()}
      {renderListSkeleton()}
    </div>
  );
}
