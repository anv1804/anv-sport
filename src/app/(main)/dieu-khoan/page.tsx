import React from "react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Metadata } from "next";
import { AlertCircle, ShieldCheck, Scale, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng - ANV Sport",
  description: "Các điều khoản và điều kiện quy định việc sử dụng chuyên trang thông tin thể thao tổng hợp ANV Sport.",
};

export default function DieuKhoanPage() {
  return (
    <StaticPageLayout title="Điều khoản sử dụng" activePath="/dieu-khoan">
      <div className="space-y-8 text-slate-700 leading-relaxed font-sans">
        
        {/* Intro Alert Box */}
        <div className="flex gap-4 p-5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <AlertCircle className="w-6 h-6 text-[var(--color-accent-main)] shrink-0 mt-0.5" />
          <div className="text-[14px] text-slate-600">
            <span className="font-bold text-slate-800">Lưu ý quan trọng:</span> Vui lòng đọc kỹ các Điều khoản sử dụng này trước khi bắt đầu trải nghiệm nội dung trên chuyên trang <strong>ANV Sport</strong>. Việc bạn tiếp tục sử dụng website đồng nghĩa với việc bạn chấp thuận hoàn toàn các điều khoản bên dưới.
            <div className="mt-2 text-slate-500 italic">Cập nhật lần cuối: Ngày 23 tháng 06 năm 2026</div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            1. Chấp nhận các điều khoản
          </h2>
          <p>
            Chào mừng bạn đến với <strong>ANV Sport</strong> (anvsport.net) – Chuyên trang thông tin thể thao tổng hợp hàng đầu. Bằng việc truy cập, duyệt nội dung hoặc sử dụng bất kỳ công cụ tiện ích nào trên website của chúng tôi (bao gồm dữ liệu trực tuyến, lịch thi đấu, bảng xếp hạng, và nhận định bằng công nghệ AI), bạn mặc định đồng ý tuân thủ và bị ràng buộc bởi các điều khoản, điều kiện dưới đây cũng như chính sách bảo mật của chúng tôi.
          </p>
          <p>
            Nếu bạn không đồng ý với bất kỳ nội dung nào trong các điều khoản này, vui lòng ngừng truy cập website ngay lập tức.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            2. Quyền sở hữu trí tuệ
          </h2>
          <p>
            Toàn bộ nội dung xuất bản trên ANV Sport bao gồm: bài viết, tin nhanh, bình luận chuyên sâu, dữ liệu số liệu giải đấu, đồ họa Infographics, thiết kế logo, hình ảnh tự chụp/thiết kế và các đoạn clip ngắn đều thuộc quyền sở hữu độc quyền của ANV Sport hoặc các nhà cung cấp nội dung đối tác, được bảo hộ nghiêm ngặt theo pháp luật sở hữu trí tuệ Việt Nam và quốc tế.
          </p>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-3">
            <h4 className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--color-accent-main)]" /> Quy định chia sẻ & trích nguồn:
            </h4>
            <ul className="list-disc pl-5 text-[14px] space-y-2 text-slate-600">
              <li>Nghiêm cấm tuyệt đối hành vi sao chép, tự ý dịch ngược mã nguồn, phát tán hoặc kinh doanh thương mại toàn bộ hoặc một phần nội dung website khi chưa có văn bản đồng ý chính thức từ ban quản lý ANV Sport.</li>
              <li>Đối với mục đích phi thương mại (chia sẻ mạng xã hội cá nhân, thảo luận diễn đàn, nghiên cứu học tập): Độc giả bắt buộc phải ghi rõ nguồn trích dẫn bằng dòng chữ nổi bật <strong>"Nguồn từ ANV Sport (anvsport.net)"</strong> và gắn kèm đường dẫn (hyperlink) trực tiếp đến bài viết gốc.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            3. Trách nhiệm của người sử dụng
          </h2>
          <p>
            Độc giả khi tham gia tương tác, đóng góp ý kiến hoặc bình luận dưới các bài viết cam kết thực hiện đúng trách nhiệm văn minh mạng:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-100 bg-slate-50 rounded-lg">
              <h4 className="font-bold text-[14px] text-slate-800 mb-1">Hành vi được khuyến khích</h4>
              <ul className="list-disc pl-4 text-[13px] text-slate-600 space-y-1">
                <li>Bình luận lành mạnh, tôn trọng lẫn nhau.</li>
                <li>Đóng góp các bài phân tích, nhận định bóng đá có dẫn chứng số liệu rõ ràng.</li>
                <li>Báo cáo kịp thời các bài viết có sai lệch thông tin hoặc lỗi kỹ thuật.</li>
              </ul>
            </div>
            <div className="p-4 border border-red-50 bg-red-50/20 rounded-lg">
              <h4 className="font-bold text-[14px] text-red-800 mb-1">Hành vi bị nghiêm cấm</h4>
              <ul className="list-disc pl-4 text-[13px] text-slate-600 space-y-1">
                <li>Bình luận xúc phạm danh dự cá nhân, tổ chức, phân biệt chủng tộc, tôn giáo hay kích động bạo lực.</li>
                <li>Đăng tải các nội dung quảng cáo rác (spam), spam link cá cược trái phép.</li>
                <li>Sử dụng các công cụ tự động (bots, crawler) để cố tình phá hoại băng thông hệ thống.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            4. Tuyên bố miễn trừ trách nhiệm
          </h2>
          <p>
            ANV Sport là một chuyên trang thông tin thể thao tổng hợp. Mặc dù chúng tôi áp dụng những tiêu chuẩn kiểm duyệt nội dung khắt khe nhất để bảo đảm dữ liệu đăng tải là chính xác, nhanh chóng và kịp thời:
          </p>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-3">
            <h4 className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-600" /> Các điều khoản miễn trừ trách nhiệm pháp lý:
            </h4>
            <ul className="list-decimal pl-5 text-[14px] space-y-2 text-slate-600">
              <li>Chúng tôi không chịu trách nhiệm đối với các thông tin kỹ thuật, số liệu tỷ số trực tiếp, lịch thi đấu bị thay đổi đột xuất bởi ban tổ chức giải đấu hoặc lỗi từ các API cung cấp dữ liệu bên thứ ba.</li>
              <li>Mọi bài phân tích kèo bóng đá, nhận định của chuyên gia hoặc <strong>dữ liệu dự đoán tự động của công nghệ siêu máy tính AI</strong> trên website đều chỉ mang tính chất tham khảo, phục vụ nhu cầu giải trí và thông tin thể thao đơn thuần. Độc giả hoàn toàn chịu trách nhiệm về mọi quyết định cá nhân dựa trên các thông tin tham khảo từ website.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            5. Điều khoản chung
          </h2>
          <p>
            ANV Sport có toàn quyền sửa đổi, bổ sung các điều khoản sử dụng này vào bất kỳ lúc nào mà không cần báo trước. Các nội dung cập nhật sẽ có hiệu lực ngay khi đăng tải chính thức trên trang web này. Việc bạn tiếp tục sử dụng website sau khi có thay đổi đồng nghĩa bạn đã chấp thuận những điều khoản mới nhất.
          </p>
        </section>

      </div>
    </StaticPageLayout>
  );
}
