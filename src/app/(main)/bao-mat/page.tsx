import React from "react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Metadata } from "next";
import { ShieldAlert, Key, Eye, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách bảo mật - ANV Sport",
  description: "Chính sách bảo mật quy định cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn tại ANV Sport.",
};

export default function BaoMatPage() {
  return (
    <StaticPageLayout title="Chính sách bảo mật" activePath="/bao-mat">
      <div className="space-y-8 text-slate-700 leading-relaxed font-sans">
        
        {/* Intro Card */}
        <div className="flex gap-4 p-5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <ShieldAlert className="w-6 h-6 text-[var(--color-accent-main)] shrink-0 mt-0.5" />
          <div className="text-[14px] text-slate-600">
            <span className="font-bold text-slate-800">Cam kết bảo mật:</span> ANV Sport hiểu rằng sự riêng tư của thông tin cá nhân là vô cùng quan trọng đối với độc giả. Chính sách bảo mật này mô tả chi tiết các loại thông tin chúng tôi thu thập, cách sử dụng và các biện pháp bảo vệ để bạn hoàn toàn yên tâm trải nghiệm.
            <div className="mt-2 text-slate-500 italic">Cập nhật lần cuối: Ngày 23 tháng 06 năm 2026</div>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            1. Các loại thông tin chúng tôi thu thập
          </h2>
          <p>
            Nhằm mục đích cung cấp trải nghiệm đọc tin thể thao mượt mà và tối ưu hóa hệ thống, ANV Sport thu thập hai loại dữ liệu chính từ độc giả:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600" /> Dữ liệu truy cập phi cá nhân:
              </h4>
              <p className="text-[13px] text-slate-600">
                Bao gồm địa chỉ IP, loại trình duyệt đang sử dụng (Chrome, Safari, Edge), hệ điều hành thiết bị, thời gian truy cập, lịch sử xem bài viết và trang liên kết trước đó. Những dữ liệu này hoàn toàn ẩn danh và chỉ dùng để phân tích lưu lượng.
              </p>
            </div>
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" /> Dữ liệu cá nhân do bạn cung cấp:
              </h4>
              <p className="text-[13px] text-slate-600">
                Khi bạn đăng ký tài khoản tham gia dự đoán bóng đá AI, gửi bình luận hoặc đăng ký nhận bản tin thể thao, chúng tôi sẽ thu thập các thông tin tối thiểu gồm: Họ tên, Email, Số điện thoại và hình ảnh đại diện (nếu có).
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            2. Mục đích sử dụng thông tin thu thập
          </h2>
          <p>
            ANV Sport cam kết chỉ sử dụng thông tin cá nhân của bạn phục vụ các mục đích hợp pháp và minh bạch dưới đây:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[14px] text-slate-600">
            <li><strong>Cung cấp dịch vụ:</strong> Nhận diện người dùng để lưu lịch sử nhận định, điểm dự đoán tỉ số các trận đấu.</li>
            <li><strong>Tương tác độc giả:</strong> Kiểm duyệt bình luận, phản hồi và hỗ trợ giải quyết các ý kiến đóng góp của độc giả.</li>
            <li><strong>Cải tiến kỹ thuật:</strong> Theo dõi hành vi duyệt tin thể thao để nâng cấp giao diện, giảm thiểu lỗi tải trang.</li>
            <li><strong>Truyền thông & Tiếp thị:</strong> Gửi email thông báo về các tính năng mới hoặc tin nóng thể thao quan trọng (bạn có thể chủ động từ chối nhận email bất kỳ lúc nào).</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            3. Biện pháp an toàn dữ liệu
          </h2>
          <p>
            Chúng tôi ứng dụng các giải pháp công nghệ an ninh thông tin tiên tiến nhất để bảo vệ tuyệt đối cơ sở dữ liệu độc giả:
          </p>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-3">
            <h4 className="font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
              <Key className="w-4 h-4 text-emerald-600" /> Hệ thống bảo vệ bao gồm:
            </h4>
            <ul className="list-decimal pl-5 text-[13px] space-y-2 text-slate-600">
              <li>Mã hóa giao thức truyền tải dữ liệu trên trang bằng chứng chỉ bảo mật SSL/TLS.</li>
              <li>Mã hóa mật khẩu người dùng bằng các thuật toán một chiều an toàn tuyệt đối.</li>
              <li>Giới hạn quyền truy cập máy chủ cơ sở dữ liệu: chỉ những lập trình viên phụ trách hệ thống được cấp quyền hạn chế để duy trì hoạt động web.</li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            4. Không chia sẻ với bên thứ ba
          </h2>
          <p>
            ANV Sport tôn trọng đạo đức kinh doanh mạng và cam kết **không bán, cho thuê, trao đổi hoặc chuyển giao** thông tin cá nhân của bạn cho bên thứ ba vì mục đích tiếp thị thương mại.
          </p>
          <p>
            Chúng tôi chỉ chia sẻ thông tin trong trường hợp đặc biệt được yêu cầu bằng văn bản chính thức của các cơ quan pháp luật có thẩm quyền tại Việt Nam nhằm mục đích tuân thủ pháp luật hoặc bảo vệ an ninh quốc gia.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            5. Quyền kiểm soát thông tin của độc giả
          </h2>
          <p>
            Bạn có toàn bộ các quyền đối với dữ liệu của mình bao gồm: yêu cầu truy xuất dữ liệu cá nhân, sửa đổi thông tin sai lệch hoặc yêu cầu **xóa vĩnh viễn tài khoản và dữ liệu liên quan** khỏi hệ thống ANV Sport. Mọi yêu cầu vui lòng liên hệ trực tiếp ban biên tập qua hòm thư hỗ trợ: <span className="font-bold text-slate-800">support@anvsport.net</span>.
          </p>
        </section>

      </div>
    </StaticPageLayout>
  );
}
