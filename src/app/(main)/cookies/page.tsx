import React from "react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Metadata } from "next";
import { Info, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách cookies - ANV Sport",
  description: "Tìm hiểu cách ANV Sport sử dụng cookie để mang lại trải nghiệm duyệt web tốt nhất cho độc giả.",
};

export default function CookiesPage() {
  return (
    <StaticPageLayout title="Chính sách cookies" activePath="/cookies">
      <div className="space-y-8 text-slate-700 leading-relaxed font-sans">
        
        {/* Intro Info Box */}
        <div className="flex gap-4 p-5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <Info className="w-6 h-6 text-[var(--color-accent-main)] shrink-0 mt-0.5" />
          <div className="text-[14px] text-slate-600">
            <span className="font-bold text-slate-800">Thông báo về Cookie:</span> Trang web của chúng tôi sử dụng cookie để phân tích lưu lượng, lưu trữ sở thích của độc giả và phân phối quảng cáo phù hợp. Hãy đọc thông tin dưới đây để hiểu rõ hơn cách chúng tôi tối ưu hóa trải nghiệm của bạn.
            <div className="mt-2 text-slate-500 italic">Cập nhật lần cuối: Ngày 23 tháng 06 năm 2026</div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            1. Cookie là gì và nguyên lý hoạt động?
          </h2>
          <p>
            Cookie là các tệp văn bản cực nhỏ được tải xuống thiết bị di động hoặc máy tính cá nhân của bạn khi bạn truy cập một website. Tệp tin này đóng vai trò như một bộ nhớ tạm thời của trình duyệt, cho phép website nhận diện thiết bị của bạn và ghi nhớ các tùy chọn cá nhân (như trạng thái đăng nhập, tỉnh thành để xem dự báo thời tiết, cỡ chữ hoặc lịch sử dự đoán tỉ số thể thao) nhằm giúp lần truy cập sau thuận tiện và nhanh chóng hơn.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            2. Các loại Cookie chúng tôi sử dụng tại ANV Sport
          </h2>
          <p>
            Dưới đây là chi tiết các loại cookie đang được lưu trữ trên trình duyệt của bạn khi xem trang:
          </p>
          
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3">Loại Cookie</th>
                  <th className="p-3">Mục đích sử dụng</th>
                  <th className="p-3">Thời gian lưu trữ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-bold text-slate-800">Cookie thiết yếu</td>
                  <td className="p-3">Duy trì phiên làm việc đăng nhập của tài khoản người dùng, hỗ trợ bảo mật tường lửa.</td>
                  <td className="p-3">Hết hạn khi đóng trình duyệt</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">Cookie tùy chọn tiện ích</td>
                  <td className="p-3">Ghi nhớ cài đặt cấu hình giao diện (Sáng/Tối), ghi nhớ tên tài khoản trong mục bình luận.</td>
                  <td className="p-3">1 năm</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">Cookie phân tích hệ thống</td>
                  <td className="p-3">Đo lường lưu lượng truy cập của các chuyên mục (Bóng đá, Võ thuật, Tennis...) để cải tiến chất lượng bài viết.</td>
                  <td className="p-3">Từ 30 ngày đến 2 năm (Google Analytics)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">Cookie quảng cáo đối tác</td>
                  <td className="p-3">Phân phối các banner quảng cáo liên quan tới thói quen tìm kiếm hoặc sở thích thể thao của độc giả.</td>
                  <td className="p-3">Thay đổi tùy theo mạng lưới quảng cáo đối tác</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            3. Hướng dẫn tắt hoặc thay đổi thiết lập Cookie
          </h2>
          <p>
            Hầu hết các trình duyệt web phổ biến hiện nay (như Chrome, Safari, Firefox, Edge) đều cho phép độc giả tự quản lý cookie. Bạn có thể thay đổi cài đặt bảo mật để từ chối lưu trữ cookie mới hoặc xóa toàn bộ cookie cũ trên máy tính.
          </p>
          <div className="flex gap-4 p-5 bg-amber-50/50 border border-amber-100 rounded-xl">
            <HelpCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[13px] text-slate-600">
              <span className="font-bold text-slate-800">Lưu ý quan trọng:</span> Nếu bạn chọn chặn hoàn toàn các cookie từ <strong>ANV Sport</strong>, một số dịch vụ cá nhân hóa (chẳng hạn như tự động lưu trạng thái đăng nhập tài khoản dự đoán AI hoặc hiển thị bảng tỷ số nhanh) sẽ không thể hoạt động ổn định và chính xác.
            </div>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
}
