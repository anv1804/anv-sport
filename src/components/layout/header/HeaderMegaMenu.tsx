"use client";

import Link from "next/link";
import { Search, Monitor, Mail, Phone, X } from "lucide-react";
import { HamburgerLink } from "@/types/settings";

type MegaMenuCategory = {
  id: string;
  label: string;
  url: string;
  target?: string;
  children?: MegaMenuCategory[];
};

type HeaderMegaMenuProps = {
  onClose: () => void;
  allCategoriesTree: MegaMenuCategory[];
  utilities: HamburgerLink[];
  apps: HamburgerLink[];
};

export function HeaderMegaMenu({ onClose, allCategoriesTree, utilities, apps }: HeaderMegaMenuProps) {
  return (
    <>
      {/* Page Dim Overlay */}
      <div
        className="fixed inset-0 top-[112px] bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Mega Menu Panel */}
      <div className="fixed top-[112px] left-0 right-0 bottom-0 bg-white shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto">
        <div className="max-w-[1160px] mx-auto px-4 md:px-6 pt-4 pb-4 md:pb-6">

          {/* Search Bar on Mobile */}
          <div className="md:hidden relative mb-5">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full bg-[#f7f7f7] border border-[#e5e5e5] rounded-full py-2.5 pl-10 pr-4 text-[14px] focus:outline-none focus:border-[var(--color-accent-main)]"
            />
            <Search className="w-4 h-4 text-[#757575] absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {/* Header: Tất cả chuyên mục & Đóng */}
          <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3 mb-5">
            <span className="font-bold text-[18px] text-[#222] uppercase">Tất cả chuyên mục</span>
            <button onClick={onClose} className="flex items-center text-[14px] text-[#757575] hover:text-[var(--color-accent-main)] transition-colors font-medium">
              Đóng <X className="w-5 h-5 ml-1" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
            {/* MAIN AREA: Category Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
                {allCategoriesTree.map(link => {
                  const hasChildren = link.children && link.children.length > 0;
                  return (
                    <div key={link.id} className="flex flex-col space-y-2">
                      <Link
                        href={link.url}
                        target={link.target}
                        onClick={onClose}
                        className="font-bold text-[14px] text-[var(--color-accent-main)] hover:opacity-80 uppercase border-b border-[#f0f0f0] pb-1.5"
                      >
                        {link.label}
                      </Link>
                      {hasChildren && (
                        <div className="flex flex-col space-y-2.5 pt-1">
                          {link.children!.map(child => (
                            <Link
                              key={child.id}
                              href={child.url}
                              target={child.target}
                              onClick={onClose}
                              className="text-[13px] text-[#4f4f4f] hover:text-[var(--color-accent-main)] transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                          {link.children!.length >= 4 && (
                            <Link href={link.url} onClick={onClose} className="text-[13px] text-[#757575] border-t border-[#e5e5e5] pt-2 mt-2 hover:text-[var(--color-accent-main)]">
                              Xem thêm
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SIDEBAR AREA: Utilities & Contact */}
            <div className="w-full lg:w-[220px] lg:border-l lg:border-[#e5e5e5] lg:pl-6 flex flex-col space-y-6">

              {/* Utilities Section 1 */}
              <div className="flex flex-col space-y-3 pb-5 border-b border-[#e5e5e5]">
                {utilities.slice(0, 3).map(util => (
                  <Link key={util.id} href={util.url} className="font-bold text-[14px] text-[#222] hover:text-[var(--color-accent-main)]">
                    {util.label}
                  </Link>
                ))}
              </div>

              {/* Utilities Section 2 */}
              <div className="flex flex-col space-y-3 pb-5 border-b border-[#e5e5e5]">
                {utilities.slice(3).map(util => (
                  <Link key={util.id} href={util.url} className="font-bold text-[14px] text-[#222] hover:text-[var(--color-accent-main)]">
                    {util.label}
                  </Link>
                ))}
              </div>

              {/* Section 3: Liên hệ */}
              <div className="flex flex-col space-y-3 pb-5 border-b border-[#e5e5e5]">
                <h3 className="text-[14px] text-[#757575] mb-1">Liên hệ</h3>
                <Link href="#" className="flex items-center text-[14px] text-[#222] hover:text-[var(--color-accent-main)]">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" /> Tòa soạn
                </Link>
                <Link href="#" className="flex items-center text-[14px] text-[#222] hover:text-[var(--color-accent-main)]">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" /> Quảng cáo
                </Link>
              </div>

              {/* Section 4: Tải ứng dụng */}
              <div className="flex flex-col space-y-3">
                <h3 className="text-[14px] text-[#757575] mb-1">Tải ứng dụng</h3>
                {apps.map(app => (
                  <Link key={app.id} href={app.url} className="flex items-center border border-[#e5e5e5] px-3 py-1.5 rounded-sm text-[13px] text-[#222] font-medium hover:bg-gray-50 transition-colors w-full justify-start">
                    <Monitor className="w-4 h-4 mr-2 text-[var(--color-accent-main)]" /> {app.label}
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
