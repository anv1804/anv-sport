"use client";

import Link from "next/link";
import { Search, User, Bell, ChevronDown, CloudSun, Monitor } from "lucide-react";

type HeaderTopBarProps = {
  siteName: string;
  logoUrl: string;
  currentDate: string;
  weatherTemp: number | null;
  renderLogo: (isMobile?: boolean) => React.ReactNode;
};

export function HeaderTopBar({ currentDate, weatherTemp, renderLogo }: HeaderTopBarProps) {
  return (
    <div className="hidden md:block w-full border-b border-[#e5e5e5]">
      <div className="flex max-w-[1160px] mx-auto px-4 md:px-6 items-center justify-between pt-1.5 pb-2">
        {/* Left: Logo & Info */}
        <div className="flex items-center">
          <Link href="/" className="flex flex-col pr-5">
            {renderLogo(false)}
            <span className="text-[11px] text-[#757575] mt-0.5 hidden lg:block">Chuyên trang Thể thao nhiều người xem nhất</span>
          </Link>

          {/* Date & Weather (Weather visible on Tablet, full details on Desktop) */}
          <div className="hidden md:flex items-center space-x-4 border-l border-[#e5e5e5] pl-5 h-8">
            <div className="hidden lg:flex items-center cursor-pointer text-[13px] text-[#757575] hover:text-[var(--color-accent-main)] transition-colors">
              Hà Nội <ChevronDown className="w-3 h-3 ml-1" />
            </div>
            <div className="flex items-center text-[13px] text-[#757575]">
              <CloudSun className="w-4 h-4 mr-1 text-gray-400" /> {weatherTemp !== null ? `${weatherTemp}°` : '--°'}
            </div>
            <div className="hidden lg:block border-l border-[#e5e5e5] pl-4 text-[13px] text-[#757575]">
              {currentDate}
            </div>
          </div>
        </div>

        {/* Right: Quick Links & Actions */}
        <div className="flex items-center text-[13px] text-[#4f4f4f]">
          {/* Quick Links (Visible on Tablet & Desktop) */}
          <div className="hidden md:flex items-center space-x-4 pr-5 border-r border-[#e5e5e5] h-6">
            <Link href="/du-doan" className="hover:text-[var(--color-accent-main)] transition-colors font-medium whitespace-nowrap">Dự đoán</Link>
            <div className="w-[1px] h-3 bg-[#e5e5e5]"></div>
            <Link href="/trung-tam-du-lieu" className="flex items-center hover:text-[var(--color-accent-main)] transition-colors font-medium whitespace-nowrap">
              <Monitor className="w-[14px] h-[14px] mr-1 text-[var(--color-accent-main)]" /> Trung tâm dữ liệu
            </Link>
          </div>

          <div className="flex items-center space-x-[22px] lg:pl-5">
            <button className="hover:text-[var(--color-accent-main)] transition-colors text-[#757575] cursor-pointer">
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button className="flex items-center hover:text-[var(--color-accent-main)] transition-colors text-[#757575] cursor-pointer">
              <User className="w-[18px] h-[18px] lg:mr-1.5" />
              <span className="hidden lg:inline text-[13px] font-medium text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Đăng nhập</span>
            </button>
            <button className="hover:text-[var(--color-accent-main)] transition-colors text-[#757575] cursor-pointer">
              <Bell className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
