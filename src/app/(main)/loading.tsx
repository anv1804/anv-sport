"use client";

import { useEffect, useState } from "react";
import { 
  showNavLoader, 
  forceHideNavLoader, 
  incrementLoadingMounts, 
  decrementLoadingMounts 
} from "@/components/layout/NavigationLoader";
import { HorizontalPost } from "@/components/domain/article/HorizontalPost";
import { VerticalPost } from "@/components/domain/article/VerticalPost";
import { DynamicCategoryBlockSkeleton } from "@/components/shared/widgets/DynamicCategoryBlockSkeleton";

export default function Loading() {
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(window.location.pathname);
    incrementLoadingMounts();
    showNavLoader();
    
    return () => {
      decrementLoadingMounts();
      forceHideNavLoader();
    };
  }, []);

  const renderSkeleton = () => {
    // If not mounted yet, render homepage skeleton as default premium loader
    if (!pathname || pathname === "/" || pathname === "/home") {
      return <HomepageSkeleton />;
    }

    if (pathname === "/du-doan" || pathname.startsWith("/du-doan?")) {
      return <PredictionPageSkeleton />;
    }

    if (pathname.endsWith(".html")) {
      return <ArticleDetailSkeleton />;
    }

    // Default Category Page skeleton
    return <CategorySkeleton />;
  };

  return (
    <div className="w-full flex-grow bg-white min-h-[80vh] p-4 md:p-6 max-w-[1160px] mx-auto">
      {renderSkeleton()}
    </div>
  );
}

function HomepageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* 1. HeroSection Skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 border-b border-[#e5e5e5] pb-4 md:pb-6 mb-4 md:mb-6 pt-4 md:pt-0">
        {/* Left main content (9 columns) */}
        <div className="lg:col-span-9 lg:border-r border-[#e5e5e5] md:pr-6">
          {/* Main post skeleton (horizontal layout: image left, text right) */}
          <HorizontalPost
            isLoading={true}
            size="hero"
            titlePosition="side"
            className="flex-col md:flex-row"
            imageClass="w-full md:w-[66%] md:mr-6 mb-4 md:mb-0"
          />

          <hr className="my-4 md:my-5 border-[#e5e5e5]" />

          {/* Desktop & Tablet sub-posts: vertical cards grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-6">
            <VerticalPost isLoading={true} titlePosition="top" size="md" />
            <VerticalPost isLoading={true} titlePosition="top" size="md" />
            {/* Third post is a Góc Nhìn opinion post in the real layout */}
            <div className="flex flex-col h-full w-full">
              <div className="w-full mb-3 space-y-2">
                <div className="w-16 h-3 bg-red-100/50 rounded"></div>
                <div className="w-11/12 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-5/6 h-4 bg-gray-100 rounded animate-pulse mt-1"></div>
                <div className="w-2/3 h-4 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between w-full mt-auto pt-2">
                <div className="flex flex-col space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-10"></div>
                </div>
                <div className="w-[60px] h-[60px] rounded-full bg-gray-200 shrink-0"></div>
              </div>
            </div>
          </div>

          {/* Mobile sub-posts: compact horizontal list matching mobile Hero UI */}
          <div className="block md:hidden mt-4 space-y-4">
            {[1, 2, 3].map((n, idx) => (
              <div key={n} className={idx < 2 ? "border-b border-[#e5e5e5] pb-4" : ""}>
                <HorizontalPost
                  isLoading={true}
                  size="sm"
                  titlePosition="side"
                  hideExcerpt={true}
                  imageClass="w-[120px] h-[75px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right side banner (3 columns) */}
        <div className="lg:col-span-3">
          <div className="bg-slate-50 border border-slate-100 rounded-lg h-[250px] lg:h-[500px] flex items-center justify-center">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </section>

      {/* 2. MatchScheduleSlider Skeleton */}
      <div className="w-full bg-[#f4f7f6] rounded-xl my-4 md:my-6 flex flex-col md:flex-row relative border border-[#e2e8f0]">
        <div className="bg-gradient-to-br from-green-600 to-green-700 md:w-[170px] flex-shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center px-4 py-3 md:p-4 rounded-t-xl md:rounded-tr-none md:rounded-l-xl">
          <div className="flex flex-row md:flex-col items-center">
            <div className="bg-white/20 p-2 md:p-3 rounded-full mb-0 md:mb-3 mr-3 md:mr-0 border border-white/10 flex-shrink-0">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-400 opacity-60 rounded-full"></div>
            </div>
            <div className="text-white font-black text-[14px] md:text-[15px] md:text-center uppercase tracking-widest leading-tight">
              LỊCH THI ĐẤU
              <span className="text-yellow-400 text-[11px] opacity-90 tracking-normal font-medium block mt-0.5 md:mt-1">3 NGÀY TỚI</span>
            </div>
          </div>
          <div className="mt-0 md:mt-6 bg-white/20 border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 md:px-4 md:py-2 rounded-full">
            XEM TẤT CẢ
          </div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar flex-1 py-4 md:py-6 px-6 md:px-8 gap-4 md:gap-6 items-center">
          {[1, 2, 3, 4].map((skeleton) => (
            <div key={skeleton} className="flex-shrink-0 w-[240px] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="h-5 w-24 bg-gray-200 rounded-full mb-3"></div>
              <div className="h-3 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MainContentSection Skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Left Column (Tin tức) */}
        <div className="lg:col-span-4 lg:border-r border-[#e5e5e5] md:pr-6">
          <div className="flex items-center justify-between mb-4 border-b-[2px] border-[#e5e5e5]">
            <h2 className="text-[16px] font-bold text-[var(--color-accent-main)] border-b-[2px] border-[var(--color-accent-main)] inline-block pb-2 -mb-[2px] uppercase tracking-wide">
              TIN TỨC ANV SPORT
            </h2>
            <span className="text-[12px] text-gray-500 font-medium">Bản quyền thuộc ANV</span>
          </div>
          {[1, 2, 3, 4, 5].map((n, index) => (
            <div key={n} className={`border-b border-[#e5e5e5] pb-5 mb-5 ${index === 4 ? 'border-0 pb-0 mb-0' : ''}`}>
              <HorizontalPost 
                isLoading={true}
                titlePosition="top"
                size="md"
                className="border-0 pb-0 mb-0"
              />
            </div>
          ))}
        </div>

        {/* Right Column (Category Blocks) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#f7f7f7] border-t-[3px] border-[var(--color-accent-main)] px-5 py-3 mb-4 md:mb-6 flex items-center justify-between">
            <div className="font-bold text-[16px] text-[var(--color-accent-main)] uppercase tracking-wide">Lịch thi đấu</div>
            <div className="flex space-x-5">
              <span className="text-[14px] text-[#222222]">Bảng xếp hạng</span>
              <span className="text-[14px] text-[#222222]">Dự đoán</span>
            </div>
          </div>
          {[0, 1, 2].map((layoutType) => (
            <DynamicCategoryBlockSkeleton key={layoutType} index={layoutType} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PredictionPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Mockup */}
      <div className="py-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
          <div className="w-24 h-5 bg-gray-200 rounded-full"></div>
          <div className="w-36 h-4 bg-gray-200 rounded-full mt-1 sm:mt-0"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-2/3"></div>
      </div>

      {/* Tabs & Quick Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-[280px] h-10 bg-gray-200 rounded-full"></div>
        <div className="w-full md:w-[300px] h-10 bg-gray-200 rounded-full"></div>
      </div>

      {/* Featured Spotlight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(n => (
          <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="w-28 h-5 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-100 rounded"></div>
            </div>
            <div className="flex justify-between items-center py-2">
              <div className="flex flex-col items-center gap-2 w-1/3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="w-20 h-4 bg-gray-100 rounded"></div>
              </div>
              <div className="w-10 h-5 bg-gray-200 rounded-full"></div>
              <div className="flex flex-col items-center gap-2 w-1/3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="w-20 h-4 bg-gray-100 rounded"></div>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full"></div>
            <div className="w-full h-10 bg-gray-200 rounded-xl mt-2"></div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Fixture Groups List */}
        <div className="lg:col-span-8 space-y-6">
          {[1, 2].map((dateIdx) => (
            <div key={dateIdx} className="space-y-4">
              {/* Header */}
              <div className="bg-slate-900 px-4 md:px-5 py-3.5 rounded-xl flex items-center justify-between">
                <div className="w-40 h-4 bg-slate-700 rounded"></div>
                <div className="w-16 h-4 bg-slate-800 rounded-full"></div>
              </div>
              
              {/* Row list */}
              <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                {[1, 2, 3].map((rowIdx) => (
                  <div key={rowIdx} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="w-32 h-3.5 bg-gray-200 rounded"></div>
                      <div className="w-24 h-3.5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center justify-end gap-3">
                        <div className="w-20 h-4 bg-gray-200 rounded"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
                      </div>
                      <div className="w-[150px] md:w-[180px] shrink-0 flex flex-col items-center gap-1.5 px-2">
                        <div className="w-12 h-5 bg-gray-200 rounded"></div>
                        <div className="w-full h-1 bg-slate-100 rounded-full"></div>
                      </div>
                      <div className="flex-1 flex items-center justify-start gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0"></div>
                        <div className="w-20 h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-[85px] md:w-[105px] shrink-0 pl-1 md:pl-3">
                        <div className="w-full h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Widgets */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 h-[200px] rounded-2xl"></div>
          <div className="bg-amber-50 h-[150px] rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="animate-pulse">
      {/* Category Header */}
      <div className="border-b border-slate-200 mb-4 pb-2">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-3"></div>
        <div className="h-6 bg-gray-100 rounded w-1/2"></div>
      </div>
      
      {/* 1. KHU VỰC TIÊU ĐIỂM BÊN TRÊN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="lg:col-span-2 relative h-[380px] bg-gray-200 rounded"></div>
        <div className="lg:col-span-1 flex flex-col justify-between gap-4 md:gap-5">
          {[1, 2].map((idx) => (
            <div key={idx} className="space-y-2">
              <div className="w-full h-[140px] bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 2. DÃY 4 BÀI VIẾT NẰM NGANG */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 md:pb-6 mb-4 md:mb-6 border-b border-[#e5e5e5]">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="space-y-2">
            <div className="w-full h-[120px] bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
      
      {/* 3. KHU VỰC FEED & SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex flex-col sm:flex-row gap-5 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <div className="w-full sm:w-[240px] md:w-[280px] aspect-[16/10] bg-gray-200 rounded-lg shrink-0"></div>
              <div className="flex flex-col flex-1 py-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg h-[300px]"></div>
        </div>
      </div>
    </div>
  );
}

function ArticleDetailSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-11/12"></div>
        <div className="h-8 bg-gray-200 rounded w-4/5"></div>
        <div className="flex items-center space-x-4 py-2 border-y border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="h-[400px] bg-gray-200 rounded w-full"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-11/12"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-full"></div>
        </div>
      </div>
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg h-[400px]"></div>
      </div>
    </div>
  );
}
