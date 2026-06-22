import React from 'react';
import { MatchHeader, MatchHeaderProps } from '../prediction/MatchHeader';
import { FormAndH2H, FormAndH2HProps } from '../prediction/FormAndH2H';
import { LineupVisualizer } from '../prediction/LineupVisualizer';
import { ArticleHtmlContent } from '@/app/(main)/[slug]/ArticleHtmlContent';
import Link from 'next/link';
import { Link as LinkIcon } from 'lucide-react';

export interface PredictionData {
  header: MatchHeaderProps;
  formAndH2h: FormAndH2HProps;
  lineups: {
    team1Formation: string;
    team2Formation: string;
    missingPlayers: { team1: string[]; team2: string[] };
  };
  advancedMetrics?: {
    totalGoals: string;
    cards: { team1: number; team2: number; total: number };
    corners: { team1: number; team2: number; total: number };
  };
  analysisHtml: string;
  sources: { title: string; url: string; siteName: string }[];
}

export function PredictionView({ post, predictionData }: { post: any, predictionData: PredictionData }) {
  // Format date
  const formattedDate = new Date(post.createdAt).toLocaleDateString('vi-VN', { 
    weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric'
  });

  return (
    <div className="w-full font-client-ui bg-white px-4 md:px-6 py-6">
      
      <div className="flex items-center text-[12px] uppercase tracking-wider border-b border-[#e5e5e5] pb-3 mb-6 font-bold">
        <Link href="/" className="text-[#16A34A] hover:text-[#15803D] transition-colors">THỂ THAO</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-[#222222]">NHẬN ĐỊNH BÓNG ĐÁ AI</span>
      </div>

      <h1 className="text-2xl md:text-3xl lg:text-[36px] leading-[1.2] font-black text-[#222222] mb-4 tracking-tight uppercase">
        {post.title}
      </h1>
      
      <div className="flex items-center text-[12px] text-[#757575] mb-6 font-medium">
        <span className="capitalize">{formattedDate} (GMT+7)</span>
      </div>

      {post.excerpt && (
        <p className="text-[16px] md:text-[17px] font-medium text-slate-700 leading-relaxed mb-8 bg-[#fcfcfc] p-4 border-l-[3px] border-[#16A34A] shadow-sm">
          {post.excerpt}
        </p>
      )}

      {/* PREDICTION COMPONENTS */}
      <MatchHeader {...predictionData.header} />
      <FormAndH2H {...predictionData.formAndH2h} team1Name={predictionData.header.team1.name} team2Name={predictionData.header.team2.name} />
      {/* ADVANCED METRICS */}
      {predictionData.advancedMetrics && (() => {
        const am = predictionData.advancedMetrics as any;
        const hasDetailed = !!am.expectedGoals;
        const t1 = predictionData.header.team1.name;
        const t2 = predictionData.header.team2.name;
        
        return (
          <div className="bg-[#18181b] p-5 md:p-6 rounded-xl mb-8 text-white shadow-md border border-[#27272a]">
            <h3 className="text-sm md:text-base font-black uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <span className="bg-[#16A34A] w-6 h-6 flex items-center justify-center rounded text-xs">📊</span>
              CHỈ SỐ DỰ ĐOÁN CHUYÊN SÂU (AI)
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* BÀN THẮNG KỲ VỌNG */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-slate-400 text-[11px] font-black uppercase tracking-wider mb-3">Bàn Thắng Kỳ Vọng (xG)</div>
                  {hasDetailed ? (
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="flex justify-between border-b border-white/5 pb-1.5 items-center">
                        <span className="font-semibold text-slate-400">Hiệp 1:</span>
                        {(() => {
                          const val = am.expectedGoals?.half1;
                          if (!val) return <span className="font-bold text-yellow-400">—</span>;
                          if (typeof val === 'object') {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="font-black text-yellow-400 text-[13px]">{val.predicted || '—'}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Kèo O/U: {val.ouLine || '—'} ({val.ouPick || '—'})</span>
                              </div>
                            );
                          }
                          return <span className="font-bold text-yellow-400">{val}</span>;
                        })()}
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5 items-center">
                        <span className="font-semibold text-slate-400">Hiệp 2:</span>
                        {(() => {
                          const val = am.expectedGoals?.half2;
                          if (!val) return <span className="font-bold text-yellow-400">—</span>;
                          if (typeof val === 'object') {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="font-black text-yellow-400 text-[13px]">{val.predicted || '—'}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Kèo O/U: {val.ouLine || '—'} ({val.ouPick || '—'})</span>
                              </div>
                            );
                          }
                          return <span className="font-bold text-yellow-400">{val}</span>;
                        })()}
                      </div>
                      <div className="flex justify-between pt-0.5 items-center">
                        <span className="font-bold text-white">Cả trận:</span>
                        {(() => {
                          const val = am.expectedGoals?.fullMatch;
                          if (!val) return <span className="font-bold text-yellow-400">—</span>;
                          if (typeof val === 'object') {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="font-extrabold text-yellow-400 text-sm">{val.predicted || '—'}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Kèo O/U: {val.ouLine || '—'} ({val.ouPick || '—'})</span>
                              </div>
                            );
                          }
                          return <span className="font-extrabold text-yellow-400 text-sm">{val}</span>;
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-yellow-400 py-3 text-center">{am.totalGoals}</div>
                  )}
                </div>
              </div>

              {/* SỐ THẺ PHẠT DỰ KIẾN */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-slate-400 text-[11px] font-black uppercase tracking-wider mb-3">Số Thẻ Phạt Dự Kiến</div>
                  {hasDetailed ? (
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="font-semibold text-slate-400">Hiệp 1:</span>
                        <span className="font-bold text-[#16A34A]">{am.expectedCards?.half1?.total ?? '—'} <span className="text-[10px] text-slate-500 font-normal">({am.expectedCards?.half1?.team1 || 0} - {am.expectedCards?.half1?.team2 || 0})</span></span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="font-semibold text-slate-400">Hiệp 2:</span>
                        <span className="font-bold text-[#16A34A]">{am.expectedCards?.half2?.total ?? '—'} <span className="text-[10px] text-slate-500 font-normal">({am.expectedCards?.half2?.team1 || 0} - {am.expectedCards?.half2?.team2 || 0})</span></span>
                      </div>
                      <div className="flex justify-between pt-0.5">
                        <span className="font-bold text-white">Cả trận:</span>
                        <span className="font-extrabold text-[#16A34A] text-sm">{am.expectedCards?.fullMatch?.total ?? '—'} <span className="text-[10px] text-slate-500 font-normal">({am.expectedCards?.fullMatch?.team1 || 0} - {am.expectedCards?.fullMatch?.team2 || 0})</span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <div className="text-2xl font-black text-[#16A34A]">{am.cards?.total || '?'}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {t1}: <span className="text-white font-bold">{am.cards?.team1}</span> | {t2}: <span className="text-white font-bold">{am.cards?.team2}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SỐ PHẠT GÓC DỰ KIẾN */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-slate-400 text-[11px] font-black uppercase tracking-wider mb-3">Số Phạt Góc Dự Kiến</div>
                  {hasDetailed ? (
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="font-semibold text-slate-400">Hiệp 1:</span>
                        <span className="font-bold text-blue-400">{am.expectedCorners?.half1?.total ?? '—'} <span className="text-[10px] text-slate-500 font-normal">({am.expectedCorners?.half1?.team1 || 0} - {am.expectedCorners?.half1?.team2 || 0})</span></span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1.5">
                        <span className="font-semibold text-slate-400">Hiệp 2:</span>
                        <span className="font-bold text-blue-400">{am.expectedCorners?.half2?.total ?? '—'} <span className="text-[10px] text-slate-500 font-normal">({am.expectedCorners?.half2?.team1 || 0} - {am.expectedCorners?.half2?.team2 || 0})</span></span>
                      </div>
                      <div className="flex justify-between pt-0.5">
                        <span className="font-bold text-white">Cả trận:</span>
                        <span className="font-extrabold text-blue-400 text-sm">{am.expectedCorners?.fullMatch?.total ?? '—'} <span className="text-[10px] text-slate-500 font-normal">({am.expectedCorners?.fullMatch?.team1 || 0} - {am.expectedCorners?.fullMatch?.team2 || 0})</span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <div className="text-2xl font-black text-blue-400">{am.corners?.total || '?'}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {t1}: <span className="text-white font-bold">{am.corners?.team1}</span> | {t2}: <span className="text-white font-bold">{am.corners?.team2}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
         <div className="bg-red-50/50 p-4 rounded border border-red-100">
            <h4 className="font-bold text-red-700 text-sm mb-2.5 flex items-center gap-2">
              <span className="bg-red-600 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold">!</span>
              LỰC LƯỢNG VẮNG MẶT ({predictionData.header.team1.name})
            </h4>
            <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-1">
              {predictionData.lineups.missingPlayers.team1.map((p, i) => <li key={i}>{p}</li>)}
              {predictionData.lineups.missingPlayers.team1.length === 0 && <li>Lực lượng đầy đủ nhất</li>}
            </ul>
         </div>
         <div className="bg-red-50/50 p-4 rounded border border-red-100">
            <h4 className="font-bold text-red-700 text-sm mb-2.5 flex items-center gap-2">
              <span className="bg-red-600 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold">!</span>
              LỰC LƯỢNG VẮNG MẶT ({predictionData.header.team2.name})
            </h4>
            <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-1">
              {predictionData.lineups.missingPlayers.team2.map((p, i) => <li key={i}>{p}</li>)}
              {predictionData.lineups.missingPlayers.team2.length === 0 && <li>Lực lượng đầy đủ nhất</li>}
            </ul>
         </div>
      </div>

      <LineupVisualizer 
        team1Name={predictionData.header.team1.name}
        team2Name={predictionData.header.team2.name}
        team1Formation={predictionData.lineups.team1Formation}
        team2Formation={predictionData.lineups.team2Formation}
      />

      {/* ANALYSIS CONTENT */}
      <div className="prose max-w-none mt-10 mb-8 border-t border-[#e5e5e5] pt-8">
        <ArticleHtmlContent html={predictionData.analysisHtml || post.content} title={post.title} thumbnailUrl={post.imageUrl} />
      </div>

      {/* CITATIONS */}
      {predictionData.sources && predictionData.sources.length > 0 && (
        <div className="bg-slate-50 p-5 rounded border border-[#e5e5e5] mb-8">
          <h3 className="text-[14px] font-bold text-[#222222] mb-3 border-b border-[#e5e5e5] pb-2 uppercase tracking-wide">Nguồn tham chiếu thông tin (Citations)</h3>
          <ul className="space-y-2">
            {predictionData.sources.map((src, i) => (
              <li key={i} className="text-[13px]">
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-start gap-2">
                  <LinkIcon size={13} className="shrink-0 mt-0.5 text-slate-400" />
                  <span><span className="font-semibold text-slate-700">[{src.siteName}]</span> - {src.title}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#757575] mt-4 italic">* Các phân tích và dữ liệu H2H, phong độ được tổng hợp tự động từ các nguồn báo chí thể thao chính thống để bảo đảm tính khách quan tối đa.</p>
        </div>
      )}
      
      {/* AUTHOR */}
      <div className="flex justify-end mt-8 border-t border-[#e5e5e5] pt-4">
        <p className="font-bold text-[#222222] text-sm">Biên soạn: <span className="text-[#16A34A]">{post.author || 'ANV SPORT AI'}</span></p>
      </div>

    </div>
  );
}
