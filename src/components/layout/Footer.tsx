import Link from "next/link";
import { Mail, Smartphone, Monitor, Megaphone } from "lucide-react";
import { SiteFooterSettings } from "@/types/settings";

type FooterProps = {
  footerData?: SiteFooterSettings;
};

export default function Footer({ footerData }: FooterProps) {
  return (
    <footer className="border-t border-[#e5e5e5] pt-4 md:pt-6 mt-10 font-sans">
      <div className="max-w-[1160px] mx-auto px-4">
        
        {/* TOP PART: NAVIGATION COLUMNS */}
        <div className="flex flex-wrap lg:flex-nowrap justify-between mb-2">
          
          <div className="w-[45%] md:w-[15%] lg:w-[12%] mb-4 md:mb-6 lg:mb-0">
            <ul className="space-y-3">
              <li><Link href="/" className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)]">Trang chủ</Link></li>
              <li><Link href="#" className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)]">Video</Link></li>
              <li><Link href="#" className="text-[14px] font-bold text-[#222222] hover:text-[var(--color-accent-main)]">Infographics</Link></li>
            </ul>
          </div>

          <div className="w-[45%] md:w-[15%] lg:w-[14%] mb-4 md:mb-6 lg:mb-0">
            <ul className="space-y-3">
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Bóng đá</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Tennis</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Marathon</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Thể thao ảo</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Phân tích</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Góc nhìn</Link></li>
            </ul>
          </div>

          <div className="w-[45%] md:w-[15%] lg:w-[14%] mb-4 md:mb-6 lg:mb-0">
            <ul className="space-y-3">
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Ngoại hạng Anh</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">La Liga</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Serie A</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Bundesliga</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Ligue 1</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">V-League</Link></li>
            </ul>
          </div>

          <div className="w-[45%] md:w-[15%] lg:w-[14%] mb-4 md:mb-6 lg:mb-0">
             <ul className="space-y-3">
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Bóng rổ</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Cầu lông</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Đua xe</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Golf</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Võ thuật</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Hậu trường</Link></li>
            </ul>
          </div>

          <div className="w-[45%] md:w-[15%] lg:w-[14%] mb-4 md:mb-6 lg:mb-0">
             <ul className="space-y-3">
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Mới nhất</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Xem nhiều</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Tin nóng</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Lịch thi đấu</Link></li>
              <li><Link href="#" className="text-[14px] text-[#4f4f4f] hover:text-[var(--color-accent-main)]">Bảng xếp hạng</Link></li>
            </ul>
          </div>

          {/* CONTACT & HOTLINE (Rightmost column) */}
          <div className="w-full lg:w-[32%] lg:border-l border-[#e5e5e5] lg:pl-6 mt-4 lg:mt-0">
            {/* Tải ứng dụng */}
            <div className="mb-5">
              <h4 className="text-[13px] text-[#757575] mb-2">Tải ứng dụng</h4>
              <div className="flex space-x-3">
                <button className="flex items-center border border-[#e5e5e5] bg-white hover:bg-gray-50 px-3 py-1.5 rounded-sm text-[13px] text-[#222222] font-medium transition-colors">
                  <Smartphone className="w-4 h-4 mr-1.5 text-[var(--color-accent-main)]" /> ANV Sport
                </button>
                <button className="flex items-center border border-[#e5e5e5] bg-white hover:bg-gray-50 px-3 py-1.5 rounded-sm text-[13px] text-[#222222] font-medium transition-colors">
                  <Monitor className="w-4 h-4 mr-1.5 text-[var(--color-accent-main)]" /> International
                </button>
              </div>
            </div>
            
            {/* Liên hệ */}
            <div className="mb-5">
              <h4 className="text-[13px] text-[#757575] mb-2">Liên hệ</h4>
              <div className="flex space-x-6">
                <Link href="#" className="flex items-center text-[14px] text-[#222222] hover:text-[var(--color-accent-main)]">
                  <Mail className="w-4 h-4 mr-2 text-[#757575]" /> Tòa soạn
                </Link>
                <Link href="#" className="flex items-center text-[14px] text-[#222222] hover:text-[var(--color-accent-main)]">
                  <Megaphone className="w-4 h-4 mr-2 text-[var(--color-accent-main)]" /> Quảng cáo
                </Link>
              </div>
            </div>

            {/* Hotline */}
            <div>
              <h4 className="text-[13px] text-[#757575] mb-2">Đường dây nóng</h4>
              <div className="flex space-x-8">
                <div>
                  <div className="text-[16px] font-bold text-[#222222]">083.888.0123</div>
                  <div className="text-[12px] text-[#757575]">(Hà Nội)</div>
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[#222222]">082.233.3555</div>
                  <div className="text-[12px] text-[#757575]">(TP. Hồ Chí Minh)</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE PART: COPYRIGHT & LINKS */}
        <div className="border-t border-b border-[#e5e5e5] py-3 my-4 md:my-6 flex flex-col md:flex-row items-center justify-between">
          <div className="text-[15px] font-medium text-[#757575] mb-4 md:mb-0">
            Báo điện tử <span className="font-extrabold text-[var(--color-accent-main)] text-[18px] italic tracking-tighter ml-1">ANV<span className="text-[#222]">SPORT</span></span>
          </div>
          <div className="flex flex-wrap items-center justify-center text-[13px] text-[#4f4f4f]">
            <Link href="#" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5]">Điều khoản sử dụng</Link>
            <Link href="#" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5]">Chính sách bảo mật</Link>
            <Link href="#" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5]">Cookies</Link>
            <Link href="#" className="hover:text-[var(--color-accent-main)] px-3 border-r border-[#e5e5e5]">RSS</Link>
            <div className="px-3 flex items-center">
              <span className="mr-2">Theo dõi ANV Sport trên</span>
              <div className="flex space-x-2">
                {footerData?.facebookUrl && (
                  <Link href={footerData.facebookUrl} target="_blank" className="hover:text-[var(--color-accent-main)] font-bold text-[#757575] flex items-center justify-center">
                    f
                  </Link>
                )}
                {footerData?.youtubeUrl && (
                  <Link href={footerData.youtubeUrl} target="_blank" className="hover:text-[var(--color-accent-main)] font-bold text-[#757575] flex items-center justify-center ml-3">
                    yt
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM PART: ADDRESS INFO */}
        <div className="flex flex-wrap justify-between text-[13px] text-[#4f4f4f] leading-[1.6] pb-4 md:pb-6">
          <div className="w-full lg:w-1/3 pr-4 mb-4 lg:mb-0">
            {footerData?.aboutText ? (
              <div className="whitespace-pre-wrap">{footerData.aboutText}</div>
            ) : (
              <>
                <div className="font-bold text-[#222222] mb-1">Chuyên trang Thể thao nhiều người xem nhất</div>
                <div>Thuộc Bộ Thể thao và Văn hóa</div>
                <div>Số giấy phép: 548/GP-BTTTT do Bộ Thông tin<br/>và Truyền thông cấp ngày 24/08/2021</div>
              </>
            )}
          </div>
          <div className="w-full lg:w-1/3 px-0 lg:px-4 mb-4 lg:mb-0">
            <div>Tổng biên tập: <span className="font-bold text-[#222]">Anv</span></div>
            <div>Địa chỉ: Tầng 10, Tòa A FPT Tower, số 10 Phạm Văn Bạch,<br/>phường Cầu Giấy, Hà Nội</div>
            <div>Điện thoại: 024 7300 8899 - máy lẻ 4500</div>
            <div>Email: webmaster@anvsport.net</div>
          </div>
          <div className="w-full lg:w-1/3 text-left lg:text-right mt-2 lg:mt-0">
            <div>{footerData?.copyright || "© 2021-2026. Toàn bộ bản quyền thuộc ANV SPORT"}</div>
          </div>
        </div>

      </div>
    </footer>
  );
}
