import React from "react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Metadata } from "next";
import { Award, Zap, Users, BarChart, CheckCircle2, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Liên hệ quảng cáo - ANV Sport",
  description: "Các giải pháp quảng cáo và hợp tác truyền thông thể thao hiệu quả trên ANV Sport.",
};

export default function QuangCaoPage() {
  return (
    <StaticPageLayout title="Liên hệ quảng cáo" activePath="/quang-cao">
      <div className="space-y-8 text-slate-700 leading-relaxed font-sans">
        
        {/* Intro */}
        <p className="text-slate-600 text-[15px]">
          <strong>ANV Sport</strong> là chuyên trang thông tin thể thao tổng hợp phát triển nhanh chóng, liên tục cập nhật mọi chuyển động sôi động về bóng đá, các môn thể thao đua xe, võ thuật, tennis, golf và pickleball. Với giao diện hiện đại, công nghệ phân tích siêu máy tính AI độc quyền và lượng người dùng trung thành lớn, chúng tôi tự tin là cầu nối truyền thông hiệu quả nhất giúp thương hiệu của doanh nghiệp tiếp cận tệp độc giả mục tiêu đầy tiềm năng.
        </p>

        {/* Analytics Grid */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[var(--color-accent-main)] pl-3">
            Số liệu thống kê lưu lượng & Độc giả
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 border border-slate-100 bg-[#f8fcfd] text-center rounded-xl">
              <div className="text-[28px] font-black text-[var(--color-accent-main)] tracking-tight">5M+</div>
              <div className="text-[12px] font-bold text-slate-500 mt-1">Lượt xem trang / Tháng</div>
            </div>
            <div className="p-5 border border-slate-100 bg-[#f8fcfd] text-center rounded-xl">
              <div className="text-[28px] font-black text-[var(--color-accent-main)] tracking-tight">85%</div>
              <div className="text-[12px] font-bold text-slate-500 mt-1">Độc giả là Nam giới</div>
            </div>
            <div className="p-5 border border-slate-100 bg-[#f8fcfd] text-center rounded-xl">
              <div className="text-[28px] font-black text-[var(--color-accent-main)] tracking-tight">18-45</div>
              <div className="text-[12px] font-bold text-slate-500 mt-1">Độ tuổi tập trung chủ yếu</div>
            </div>
            <div className="p-5 border border-slate-100 bg-[#f8fcfd] text-center rounded-xl">
              <div className="text-[28px] font-black text-[var(--color-accent-main)] tracking-tight">15 Phút</div>
              <div className="text-[12px] font-bold text-slate-500 mt-1">Thời gian đọc trung bình</div>
            </div>
          </div>
        </section>

        {/* Key Advertising Formats */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[var(--color-accent-main)] pl-3">
            Các hình thức quảng cáo thế mạnh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-4 p-4 border border-slate-100 bg-slate-50/50 rounded-lg hover:border-[var(--color-accent-main)]/30 hover:bg-emerald-50/5 transition-all duration-300">
              <Zap className="w-6 h-6 text-[var(--color-accent-main)] shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[14px]">Banner Banner Ad Takeover</h4>
                <p className="text-slate-600 text-[12px] mt-1">Định dạng quảng cáo bao trọn màn hình nền (Takeover Background) hai bên rìa của trang tin, mang lại ấn tượng thị giác tuyệt đối cho thương hiệu lớn.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-slate-100 bg-slate-50/50 rounded-lg hover:border-[var(--color-accent-main)]/30 hover:bg-emerald-50/5 transition-all duration-300">
              <BarChart className="w-6 h-6 text-[var(--color-accent-main)] shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[14px]">Banner Standard Slots</h4>
                <p className="text-slate-600 text-[12px] mt-1">Hỗ trợ các vị trí banner chuẩn hóa cao như Banner Masthead, Leaderboard (trên cùng trang chủ) hay Sidebar Sticky (chạy theo cuộn chuột).</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-slate-100 bg-slate-50/50 rounded-lg hover:border-[var(--color-accent-main)]/30 hover:bg-emerald-50/5 transition-all duration-300">
              <Users className="w-6 h-6 text-[var(--color-accent-main)] shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[14px]">Bài PR & Đánh giá sản phẩm</h4>
                <p className="text-slate-600 text-[12px] mt-1">Biên soạn các nội dung trải nghiệm dịch vụ thể thao, bài phỏng vấn, đánh giá giày chạy bộ, dụng cụ thể thao tinh tế, chèn link tự nhiên.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 border border-slate-100 bg-slate-50/50 rounded-lg hover:border-[var(--color-accent-main)]/30 hover:bg-emerald-50/5 transition-all duration-300">
              <TrendingUp className="w-6 h-6 text-[var(--color-accent-main)] shrink-0" />
              <div>
                <h4 className="font-bold text-slate-800 text-[14px]">Quảng cáo Widget Dự đoán AI</h4>
                <p className="text-slate-600 text-[12px] mt-1">Hình thức tài trợ độc quyền thương hiệu trực tiếp bên trong widget Phân tích & Dự đoán trận đấu bằng AI – khu vực có lượt tương tác cao nhất.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Reference Pricing Table */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 border-l-4 border-[var(--color-accent-main)] pl-3">
            Bảng giá quảng cáo Banner tham khảo
          </h3>
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3">Vị trí hiển thị</th>
                  <th className="p-3">Kích thước (px)</th>
                  <th className="p-3">Định dạng hỗ trợ</th>
                  <th className="p-3 text-right whitespace-nowrap">Đơn giá tham khảo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-800">Banner Background Takeover</td>
                  <td className="p-3">2 bên rìa trang web (1600x1000)</td>
                  <td className="p-3">JPG, PNG (Dưới 150KB)</td>
                  <td className="p-3 text-right text-emerald-600 font-bold whitespace-nowrap">Liên hệ thỏa thuận</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-800">Banner Leaderboard Trang chủ</td>
                  <td className="p-3">1000x200 (Responsive)</td>
                  <td className="p-3">JPG, PNG, GIF, HTML5</td>
                  <td className="p-3 text-right text-emerald-600 font-bold whitespace-nowrap">15,000,000đ / Tuần</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-800">Banner Sidebar chuyên mục</td>
                  <td className="p-3">300x250 hoặc 300x600</td>
                  <td className="p-3">JPG, PNG, HTML5</td>
                  <td className="p-3 text-right text-emerald-600 font-bold whitespace-nowrap">8,000,000đ / Tuần</td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-800">Bài viết PR truyền thông</td>
                  <td className="p-3">Không giới hạn chữ, kèm 3 ảnh</td>
                  <td className="p-3">Chèn tối đa 2 Backlinks Do-follow</td>
                  <td className="p-3 text-right text-emerald-600 font-bold whitespace-nowrap">5,000,000đ / Bài viết</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Business Contact Cards */}
        <section className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 space-y-4">
          <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-main)] shrink-0" />
            Liên hệ hợp tác & Nhận báo giá chi tiết
          </h3>
          <p className="text-slate-600 text-[14px]">
            Đội ngũ tư vấn truyền thông thể thao của ANV Sport sẽ phản hồi yêu cầu của doanh nghiệp trong vòng 4 giờ làm việc:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[14px] pt-2">
            <div className="p-4 bg-white border border-slate-200/60 rounded-lg space-y-1 shadow-sm">
              <div className="text-slate-500 font-medium">Hotline tư vấn nhanh:</div>
              <div className="text-slate-800 font-black text-[17px]">0965 064 241 (Mr. An)</div>
              <div className="text-[11px] text-slate-400">Hỗ trợ qua Zalo, Telegram, Phone 24/7</div>
            </div>
            <div className="p-4 bg-white border border-slate-200/60 rounded-lg space-y-1 shadow-sm">
              <div className="text-slate-500 font-medium">Email nhận yêu cầu báo giá:</div>
              <div className="text-slate-800 font-black text-[17px] break-all text-emerald-600">nguyenan18404@gmail.com</div>
              <div className="text-[11px] text-slate-400">Vui lòng đính kèm thông tin công ty và ngân sách dự kiến</div>
            </div>
          </div>
        </section>

      </div>
    </StaticPageLayout>
  );
}
