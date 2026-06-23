import Link from "next/link";
import React from "react";

type StaticPageLayoutProps = {
  title: string;
  activePath: string;
  children: React.ReactNode;
};

const SIDEBAR_LINKS = [
  { href: "/dieu-khoan", label: "Điều khoản sử dụng" },
  { href: "/bao-mat", label: "Chính sách bảo mật" },
  { href: "/cookies", label: "Chính sách cookies" },
  { href: "/rss", label: "Hướng dẫn RSS" },
  { href: "/lien-he", label: "Góp ý & Liên hệ" },
  { href: "/quang-cao", label: "Liên hệ quảng cáo" },
];

export default function StaticPageLayout({ title, activePath, children }: StaticPageLayoutProps) {
  return (
    <div
      className="w-full bg-[#111111] bg-no-repeat relative pt-0 md:pt-[20px]"
      style={{
        backgroundImage: "url('/bg-ads-full.png')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="w-full max-w-[1160px] mx-auto px-4 pt-8 pb-6 md:px-6 md:pt-12 md:pb-12 font-sans bg-white relative z-20 shadow-[0_0_20px_rgba(0,0,0,0.15)] min-h-screen">
        


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#222222] mb-6 leading-tight border-b-2 border-[var(--color-accent-main)] pb-3 inline-block">
              {title}
            </h1>
            <div className="prose prose-slate max-w-none text-[#333333] text-[15px] leading-[1.8] space-y-6">
              {children}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-[#f8f9fa] border border-slate-100 rounded-lg p-5 sticky top-[130px] md:top-[120px] transition-all duration-300 shadow-sm">
              <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-200">
                Thông tin & Hỗ trợ
              </h3>
              <ul className="space-y-1">
                {SIDEBAR_LINKS.map((link) => {
                  const isActive = activePath === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`block py-2.5 px-3 rounded-md text-[14px] font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-[var(--color-accent-main)] text-white shadow-md shadow-emerald-500/20 translate-x-1"
                            : "text-slate-600 hover:text-[var(--color-accent-main)] hover:bg-slate-100/80"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 pt-5 border-t border-slate-200/80 text-[13px] text-slate-500 space-y-2">
                <div>
                  <strong>Hỗ trợ kỹ thuật:</strong>
                  <div className="text-slate-700 font-medium">support@anvsport.net</div>
                </div>
                <div>
                  <strong>Hotline góp ý:</strong>
                  <div className="text-slate-700 font-medium">083.888.0123 (HN)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
