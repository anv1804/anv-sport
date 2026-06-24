import Link from 'next/link';
import { Bot, Activity, Trophy, ChevronRight } from 'lucide-react';
import { createArticleUrl } from '@/lib/helpers/url';

interface Post {
  id: number;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface Props {
  posts: Post[];
}

const CARD_META = [
  { badge: { text: 'PHÂN TÍCH AI', cls: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-700', icon: '★' }, icon: <Bot className="w-5 h-5 text-emerald-500" />, time: '5 phút trước', views: '12.4K', comments: '86' },
  { badge: { text: 'CHIẾN THUẬT', cls: 'bg-purple-50/90 border-purple-200/80 text-purple-700', icon: '⚙' }, icon: <Activity className="w-5 h-5 text-purple-500" />, time: '12 phút trước', views: '8.7K', comments: '54' },
  { badge: { text: 'NHẬN ĐỊNH', cls: 'bg-blue-50/90 border-blue-200/80 text-blue-700', icon: '⚡' }, icon: <Trophy className="w-5 h-5 text-blue-500" />, time: '18 phút trước', views: '15.6K', comments: '112' },
];

export default function AiPostsFeed({ posts }: Props) {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="max-w-[1160px] mx-auto px-4 mt-10">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-[24px] p-4 md:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:gap-6 md:mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.1)] shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-slate-900 text-lg md:text-xl font-black uppercase tracking-wider flex items-center gap-1.5">
                TIN TỨC & NHẬN ĐỊNH <span className="text-emerald-600">AI MỚI NHẤT</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1 font-medium">
                Phân tích chuyên sâu từ AI • Dữ liệu chính xác • Cập nhật liên tục
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-150/60 text-emerald-600 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2 self-start sm:self-auto shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-440 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Cập nhật 5 phút trước
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {posts.slice(0, 3).map((post, index) => {
            const { badge, icon, time, views, comments } = CARD_META[index % 3];
            return (
              <Link
                key={post.id}
                href={createArticleUrl(post.title, post.id)}
                className="bg-white border border-slate-200/60 hover:border-emerald-450 rounded-2xl overflow-hidden flex flex-col transition-all duration-350 group shadow-[0_4px_16px_rgba(15,23,42,0.02)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.06)]"
              >
                {post.imageUrl && (
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-105"
                    />
                    <div className={`absolute top-3 left-3 border text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md backdrop-blur-md flex items-center gap-1 ${badge.cls}`}>
                      <span>{badge.icon}</span> {badge.text}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/60 border border-white/10 text-[9px] font-bold text-white/95 px-2.5 py-1 rounded-md backdrop-blur-md">
                      {time}
                    </div>
                    <div className="absolute bottom-3 right-3 w-10 h-10 bg-white/95 border border-slate-200/80 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] group-hover:border-emerald-450 transition-colors">
                      {icon}
                    </div>
                  </div>
                )}

                <div className="p-4 md:p-6 flex-1 flex flex-col">
                  <h3 className="text-slate-900 font-extrabold text-base leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors duration-200">
                    {post.title}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-2 mt-2 leading-relaxed flex-1 font-medium">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100/90 pt-4 mt-4 text-[12px] font-bold">
                    <span className="text-emerald-600 flex items-center gap-1 group-hover:underline">
                      Đọc ngay <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1 text-[11px] text-amber-500/90 font-black">🔥 {views}</span>
                      <span className="flex items-center gap-1 text-[11px] font-black text-slate-450">💬 {comments}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
