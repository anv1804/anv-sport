"use client";

import React, { useState } from "react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function LienHePage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1200);
  };

  return (
    <StaticPageLayout title="Góp ý & Liên hệ" activePath="/lien-he">
      <div className="space-y-8 font-sans">
        <p className="text-slate-600 text-[15px] leading-relaxed">
          Mọi thắc mắc về nội dung, đóng góp ý kiến xây dựng chuyên trang, báo cáo lỗi kỹ thuật hoặc liên hệ hợp tác nội dung thể thao, vui lòng liên hệ với chúng tôi qua các kênh dưới đây hoặc điền thông tin vào mẫu liên hệ nhanh.
        </p>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-100 bg-[#f8f9fa] rounded-xl p-5 flex items-start space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-accent-main)]/20 transition-all duration-300">
            <div className="bg-emerald-50 text-[var(--color-accent-main)] p-3 rounded-full shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[14px]">Địa chỉ email</h4>
              <p className="text-slate-600 text-[13px] mt-1 break-all font-medium">support@anvsport.net</p>
            </div>
          </div>

          <div className="border border-slate-100 bg-[#f8f9fa] rounded-xl p-5 flex items-start space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-accent-main)]/20 transition-all duration-300">
            <div className="bg-emerald-50 text-[var(--color-accent-main)] p-3 rounded-full shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[14px]">Đường dây nóng</h4>
              <p className="text-slate-600 text-[13px] mt-1 font-medium">083.888.0123 (HN)</p>
              <p className="text-slate-600 text-[13px] font-medium">082.233.3555 (TP.HCM)</p>
            </div>
          </div>

          <div className="border border-slate-100 bg-[#f8f9fa] rounded-xl p-5 flex items-start space-x-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-accent-main)]/20 transition-all duration-300">
            <div className="bg-emerald-50 text-[var(--color-accent-main)] p-3 rounded-full shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[14px]">Trụ sở chính</h4>
              <p className="text-slate-600 text-[13px] mt-1 font-medium leading-relaxed">Tòa nhà FPT Tower, số 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="border border-slate-100 bg-white rounded-xl p-6 md:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Gửi phản hồi nhanh cho ban biên tập
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-600">Họ và tên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-slate-200 focus:border-[var(--color-accent-main)] focus:ring-2 focus:ring-emerald-500/20 px-4 py-2.5 rounded-lg text-[14px] outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[13px] font-bold text-slate-600">Địa chỉ Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nguyenvana@gmail.com"
                  className="w-full border border-slate-200 focus:border-[var(--color-accent-main)] focus:ring-2 focus:ring-emerald-500/20 px-4 py-2.5 rounded-lg text-[14px] outline-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-600">Tiêu đề liên hệ <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Góp ý nội dung bài viết..."
                className="w-full border border-slate-200 focus:border-[var(--color-accent-main)] focus:ring-2 focus:ring-emerald-500/20 px-4 py-2.5 rounded-lg text-[14px] outline-none transition-all duration-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-600">Nội dung chi tiết <span className="text-red-500">*</span></label>
              <textarea
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Viết ý kiến đóng góp hoặc phản hồi của bạn tại đây..."
                className="w-full border border-slate-200 focus:border-[var(--color-accent-main)] focus:ring-2 focus:ring-emerald-500/20 px-4 py-3 rounded-lg text-[14px] outline-none transition-all duration-200"
              />
            </div>

            {isSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3.5 rounded-lg text-[14px] font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                Cảm ơn bạn đã gửi ý kiến đóng góp! Chúng tôi sẽ xem xét và phản hồi sớm nhất qua email.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-[var(--color-accent-main)] hover:bg-[#0fa464] disabled:opacity-70 text-white font-bold text-[14px] px-6 py-3 rounded-lg shadow-lg shadow-emerald-500/20 hover:translate-y-[-1px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi liên hệ"}
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </StaticPageLayout>
  );
}
