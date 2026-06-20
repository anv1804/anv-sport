"use client";

import Link from "next/link";
import { User, Bell, CloudSun, MapPin } from "lucide-react";
import { Menu } from "lucide-react";

type HeaderMobileBarProps = {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  weatherTemp: number | null;
  renderLogo: (isMobile?: boolean) => React.ReactNode;
};

export function HeaderMobileBar({ isMenuOpen, onMenuToggle, weatherTemp, renderLogo }: HeaderMobileBarProps) {
  return (
    <>
      {/* Mobile Top Bar (Hidden on Desktop) */}
      <div className="flex md:hidden items-center justify-between px-4 py-2 border-b border-[#e5e5e5] bg-white">
        {/* Left: Menu */}
        <div className="flex items-center w-[70px]">
          <button onClick={onMenuToggle} className="text-[#4f4f4f]">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Center: Logo & Slogan */}
        <div className="flex flex-col items-center justify-center flex-1">
          <Link href="/" className="flex flex-col items-center">
            {renderLogo(true)}
            <span className="text-[10px] text-[#757575] mt-1 tracking-wide">Chuyên trang thể thao</span>
          </Link>
        </div>

        {/* Right: User & Bell */}
        <div className="flex items-center justify-end space-x-4 w-[70px]">
          <button className="text-[#4f4f4f]">
            <User className="w-5 h-5" />
          </button>
          <button className="text-[#4f4f4f]">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Weather Bar (Hidden on Desktop) */}
      <div className="flex md:hidden items-center justify-between px-4 py-[6px] border-b border-[#e5e5e5] bg-[#f9f9f9]">
        <div className="flex items-center text-[12px] text-[#757575] cursor-pointer">
          <MapPin className="w-3 h-3 mr-1" /> Hà Nội
        </div>
        <div className="flex items-center text-[12px] text-[#757575]">
          <CloudSun className="w-3 h-3 mr-1 text-[#4ba2e3]" />
          <span className="font-semibold text-[#222]">{weatherTemp !== null ? `${weatherTemp}°` : '27°'}</span>
          <span className="ml-1">32° / 27°</span>
        </div>
      </div>
    </>
  );
}
