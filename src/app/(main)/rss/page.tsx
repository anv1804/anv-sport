"use client";

import React, { useState } from "react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Rss, Copy, Check, Info } from "lucide-react";

const RSS_FEEDS = [
  { name: "Trang chủ tổng hợp", slug: "trang-chu" },
  { name: "Bóng đá", slug: "bong-da" },
  { name: "Tennis", slug: "tennis" },
  { name: "Marathon & Chạy bộ", slug: "marathon" },
  { name: "Đua xe (F1, MotoGP)", slug: "dua-xe" },
  { name: "Võ thuật", slug: "vo-thuat" },
  { name: "Golf", slug: "golf" },
];

export default function RssPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (slug: string, index: number) => {
    let domain = "";
    if (typeof window !== "undefined") {
      domain = window.location.origin;
    } else {
      domain = "https://anvsport.net";
    }
    const fullUrl = `${domain}/rss/${slug}.xml`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <StaticPageLayout title="Hướng dẫn RSS" activePath="/rss">
      <div className="space-y-8 text-slate-700 leading-relaxed font-sans">
        
        {/* Intro Box */}
        <p className="text-slate-600 text-[15px]">
          <strong>RSS (Really Simple Syndication)</strong> là định dạng chia sẻ dữ liệu XML chuẩn quốc tế được sử dụng rộng rãi bởi các độc giả thể thao chuyên nghiệp. RSS giúp bạn theo dõi các bản tin thể thao mới nhất của <strong>ANV Sport</strong> một cách tự động, nhanh chóng và tập trung tại một ứng dụng đọc tin (như Feedly, Netvibes...) mà không cần phải truy cập từng trang web riêng lẻ.
        </p>

        {/* Dynamic Feeds Table with Click-to-Copy */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            1. Danh mục các kênh RSS cung cấp bởi ANV Sport
          </h2>
          <p className="text-slate-600 text-[14px]">
            Nhấp chuột vào biểu tượng sao chép để lấy đường dẫn RSS Feed đầy đủ và dán vào phần mềm đọc tin tức của bạn:
          </p>

          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="p-3">Chuyên mục</th>
                  <th className="p-3">Đường dẫn RSS Feed XML</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {RSS_FEEDS.map((feed, idx) => (
                  <tr key={feed.slug} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-800 flex items-center gap-1.5">
                      <Rss className="w-4 h-4 text-orange-500 shrink-0" />
                      {feed.name}
                    </td>
                    <td className="p-3 font-mono text-emerald-600 break-all select-all">
                      /rss/{feed.slug}.xml
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleCopy(feed.slug, idx)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                          copiedIndex === idx
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-white text-slate-600 border-slate-200 hover:border-[var(--color-accent-main)] hover:text-[var(--color-accent-main)]"
                        }`}
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Sao chép link
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Step-by-Step Guide */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            2. Hướng dẫn kết nối và sử dụng RSS Feed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2">
              <div className="text-[20px] font-black text-[var(--color-accent-main)]">01</div>
              <h4 className="font-bold text-slate-800 text-[14px]">Chọn app đọc tin</h4>
              <p className="text-[12px] text-slate-600">Đăng ký tài khoản miễn phí trên các công cụ đọc tin RSS uy tín như <strong>Feedly</strong>, <strong>Inoreader</strong> hoặc cài đặt extension đọc RSS trên trình duyệt Chrome/Safari.</p>
            </div>
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2">
              <div className="text-[20px] font-black text-[var(--color-accent-main)]">02</div>
              <h4 className="font-bold text-slate-800 text-[14px]">Sao chép đường dẫn</h4>
              <p className="text-[12px] text-slate-600">Bấm nút "Sao chép link" tương ứng với chuyên mục thể thao bạn yêu thích ở danh sách phía bên trên (Ví dụ: kênh Bóng đá).</p>
            </div>
            <div className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl space-y-2">
              <div className="text-[20px] font-black text-[var(--color-accent-main)]">03</div>
              <h4 className="font-bold text-slate-800 text-[14px]">Dán link & Hoàn tất</h4>
              <p className="text-[12px] text-slate-600">Dán đường dẫn vừa sao chép vào mục "Add Content" hoặc "Search feed URL" trên app Feedly của bạn để bắt đầu tự động nhận tin tức 24/7.</p>
            </div>
          </div>
        </section>

        {/* Terms of RSS */}
        <section className="space-y-4">
          <h2 className="text-[18px] font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="w-1.5 h-6 bg-[var(--color-accent-main)] rounded-full inline-block"></span>
            3. Điều khoản sử dụng nguồn tin RSS
          </h2>
          <p>
            Các kênh RSS XML từ ANV Sport được cung cấp hoàn toàn miễn phí phục vụ nhu cầu đọc tin tức cá nhân phi thương mại.
          </p>
          <div className="flex gap-4 p-5 bg-amber-50/50 border border-amber-100 rounded-xl">
            <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[13px] text-slate-600">
              <span className="font-bold text-slate-800">Quy định bản quyền:</span> Mọi hành vi lợi dụng nguồn RSS để tự động cào và sao chép nguyên văn bài viết đăng lại lên các ứng dụng hoặc trang web thương mại khác mà không ghi rõ nguồn gốc hoặc chưa có sự đồng ý chính thức từ ANV Sport đều bị coi là vi phạm bản quyền nghiêm trọng.
            </div>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
}
