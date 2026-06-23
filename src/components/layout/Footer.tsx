import Link from "next/link";
import { Mail, Smartphone, Monitor, Megaphone } from "lucide-react";
import { SiteFooterSettings, MenuItem } from "@/types/settings";

type FooterProps = {
  footerData?: SiteFooterSettings;
  menuItems?: MenuItem[];
};

export default function Footer({ footerData, menuItems }: FooterProps) {
  return (
    <footer className="border-t border-[#e5e5e5] pt-4 md:pt-6 mt-10 font-sans bg-white">
      <div className="max-w-[1160px] mx-auto px-4">
        
        {/* TOP PART: NAVIGATION COLUMNS */}
        <div className="flex flex-col lg:flex-row justify-between mb-4">
          
          {/* Navigation Links Grid */}
          <div className="w-full lg:w-[65%] grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row lg:justify-between gap-x-4 gap-y-6 lg:gap-y-0">
            {menuItems && menuItems.length > 0 ? (
              menuItems.filter(item => item.url !== '/du-doan' && item.url !== '/').slice(0, 5).map((item) => (
                <div key={item.id} className="w-full lg:w-[18%]">
                  <Link href={item.url} className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)] mb-3 block transition-colors uppercase">
                    {item.label}
                  </Link>
                  {item.children && item.children.length > 0 && (
                    <ul className="space-y-2">
                      {item.children.slice(0, 6).map((subItem) => (
                        <li key={subItem.id}>
                          <Link href={subItem.url} className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)] transition-colors">
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              // Fallback static structure
              <>
                <div className="w-full lg:w-[18%]">
                  <ul className="space-y-3">
                    <li><Link href="/" className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)]">Trang chủ</Link></li>
                    <li><Link href="#" className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)]">Video</Link></li>
                    <li><Link href="#" className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)]">Infographics</Link></li>
                  </ul>
                </div>
                <div className="w-full lg:w-[18%]">
                  <Link href="#" className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)] mb-3 block transition-colors uppercase">Bóng đá</Link>
                  <ul className="space-y-2">
                    <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Ngoại hạng Anh</Link></li>
                    <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">La Liga</Link></li>
                    <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Serie A</Link></li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* CONTACT & HOTLINE */}
          <div className="w-full lg:w-[32%] border-t border-[#e5e5e5] lg:border-t-0 lg:border-l lg:pl-6 pt-6 lg:pt-0 mt-6 lg:mt-0 flex flex-col md:flex-row lg:flex-col justify-between items-start gap-6 lg:gap-6">
            
            {/* Left Sub-container on tablet (combines App Download & Links) */}
            <div className="w-full md:w-[58%] lg:w-full flex flex-col gap-5">
              
              {/* Tải ứng dụng */}
              <div>
                <h4 className="text-[13px] text-[#757575] mb-2 font-semibold">Tải ứng dụng</h4>
                <div className="grid grid-cols-2 md:flex md:flex-row gap-3">
                  <button className="flex items-center justify-center border border-[#e5e5e5] hover:border-[var(--color-accent-main)] bg-white hover:bg-emerald-50/10 px-3 py-1.5 rounded-sm text-[13px] text-[#222222] hover:text-[var(--color-accent-main)] font-medium transition-all duration-200 cursor-pointer w-full md:w-auto shrink-0">
                    <Smartphone className="w-4 h-4 mr-1.5 text-[var(--color-accent-main)]" /> ANV Sport
                  </button>
                  <button className="flex items-center justify-center border border-[#e5e5e5] hover:border-[var(--color-accent-main)] bg-white hover:bg-emerald-50/10 px-3 py-1.5 rounded-sm text-[13px] text-[#222222] hover:text-[var(--color-accent-main)] font-medium transition-all duration-200 cursor-pointer w-full md:w-auto shrink-0">
                    <Monitor className="w-4 h-4 mr-1.5 text-[var(--color-accent-main)]" /> International
                  </button>
                </div>
              </div>
              
              {/* Liên hệ */}
              <div>
                <h4 className="text-[13px] text-[#757575] mb-2 font-semibold">Liên hệ</h4>
                <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-6">
                  <Link href="/lien-he" className="flex items-center justify-center border border-[#e5e5e5] hover:border-[var(--color-accent-main)] md:border-0 md:hover:border-0 bg-slate-50/50 hover:bg-emerald-50/10 md:bg-transparent md:hover:bg-transparent px-3 py-2 md:px-0 md:py-0 rounded-sm text-[14px] text-[#222222] hover:text-[var(--color-accent-main)] transition-all duration-200 w-full md:w-auto shrink-0 font-medium">
                    <Mail className="w-4 h-4 mr-2 text-[#757575] group-hover:text-[var(--color-accent-main)]" /> Góp ý & Liên hệ
                  </Link>
                  <Link href="/quang-cao" className="flex items-center justify-center border border-[#e5e5e5] hover:border-[var(--color-accent-main)] md:border-0 md:hover:border-0 bg-slate-50/50 hover:bg-emerald-50/10 md:bg-transparent md:hover:bg-transparent px-3 py-2 md:px-0 md:py-0 rounded-sm text-[14px] text-[#222222] hover:text-[var(--color-accent-main)] transition-all duration-200 w-full md:w-auto shrink-0 font-medium">
                    <Megaphone className="w-4 h-4 mr-2 text-[var(--color-accent-main)]" /> Quảng cáo
                  </Link>
                </div>
              </div>

            </div>

            {/* Hotline (Right column on tablet) */}
            <div className="w-full md:w-[38%] lg:w-full md:border-l border-[#e5e5e5] md:pl-6 lg:border-l-0 lg:pl-0">
              <h4 className="text-[13px] text-[#757575] mb-2 font-semibold">Đường dây nóng</h4>
              <div className="grid grid-cols-2 md:flex md:flex-col lg:flex-row gap-3 md:gap-3 lg:gap-8">
                <div className="bg-slate-50/50 md:bg-transparent border border-slate-100 md:border-0 p-2.5 md:p-0 rounded-sm text-center md:text-left">
                  <div className="text-[15px] font-bold text-[#222222]">083.888.0123</div>
                  <div className="text-[12px] text-[#757575]">(Hà Nội)</div>
                </div>
                <div className="bg-slate-50/50 md:bg-transparent border border-slate-100 md:border-0 p-2.5 md:p-0 rounded-sm text-center md:text-left">
                  <div className="text-[15px] font-bold text-[#222222]">082.233.3555</div>
                  <div className="text-[12px] text-[#757575]">(TP. Hồ Chí Minh)</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* MIDDLE PART: COPYRIGHT & LINKS */}
        <div className="border-t border-b border-[#e5e5e5] py-3 my-4 md:my-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center text-[15px] font-medium text-[#757575]">
            <img src="/logos/anv-sport-logo.png" alt="ANV Sport" className="h-8 object-contain" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-y-2 text-[13px] text-[#4f4f4f]">
            <Link href="/dieu-khoan" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5] transition-colors">Điều khoản sử dụng</Link>
            <Link href="/bao-mat" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5] transition-colors">Chính sách bảo mật</Link>
            <Link href="/cookies" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5] transition-colors">Cookies</Link>
            <Link href="/rss" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5] transition-colors">RSS</Link>
            <div className="px-3 flex items-center">
              <span className="mr-2">Theo dõi ANV Sport trên</span>
              <div className="flex space-x-2">
                {footerData?.facebookUrl && (
                  <Link href={footerData.facebookUrl} target="_blank" className="hover:text-[var(--color-accent-main)] font-bold text-[#757575] flex items-center justify-center transition-colors">
                    f
                  </Link>
                )}
                {footerData?.youtubeUrl && (
                  <Link href={footerData.youtubeUrl} target="_blank" className="hover:text-[var(--color-accent-main)] font-bold text-[#757575] flex items-center justify-center ml-3 transition-colors">
                    yt
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM PART: ADDRESS INFO */}
        <div className="flex flex-wrap justify-between text-[13px] text-[#4f4f4f] leading-[1.6] pb-6 gap-y-6 md:gap-y-0">
          <div className="w-full md:w-[48%] lg:w-[40%] pr-4">
            {footerData?.aboutText ? (
              <div className="whitespace-pre-wrap">{footerData.aboutText}</div>
            ) : (
              <>
                <div className="font-bold text-[#222222] mb-1">ANV Sport - Chuyên trang thông tin thể thao tổng hợp</div>
                <div>Cập nhật liên tục tin tức bóng đá, lịch thi đấu, bảng xếp hạng và phân tích chuyên sâu các giải đấu hàng đầu thế giới.</div>
              </>
            )}
          </div>
          <div className="w-full md:w-[48%] lg:w-[35%] md:pl-6 md:border-l border-[#e5e5e5] lg:border-l-0 lg:pl-0">
            <div><strong>Vận hành bởi:</strong> ANV Sport Team</div>
            <div>Địa chỉ: Tòa nhà FPT Tower, số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội</div>
            <div>Email hỗ trợ: support@anvsport.net</div>
          </div>
          <div className="w-full md:w-full lg:w-[25%] text-left md:text-center lg:text-right mt-2 md:mt-6 lg:mt-0 md:border-t lg:border-t-0 border-[#e5e5e5] md:pt-4 lg:pt-0">
            <div>{footerData?.copyright || "© 2021-2026. Toàn bộ bản quyền thuộc ANV SPORT"}</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
