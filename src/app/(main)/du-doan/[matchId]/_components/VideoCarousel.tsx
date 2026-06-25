import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { type MatchInfo } from './helpers';

interface Props { matchInfo: MatchInfo; }

function VideoCard({ href, logoSrc, title, subtitle }: { href: string; logoSrc: string; title: string; subtitle: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="relative shrink-0 w-[240px] h-[135px] rounded border border-slate-200 overflow-hidden group shadow-sm">
      <Image src={logoSrc} fill className="object-cover opacity-20 blur-sm scale-110" alt="" />
      <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <PlayCircle className="w-12 h-12 text-white/90 group-hover:text-white transition-colors" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 text-white">
        <p className="font-bold text-[13px] leading-tight mb-0.5 drop-shadow">{title}</p>
        <p className="text-[10px] text-slate-200 uppercase tracking-widest font-bold">{subtitle}</p>
      </div>
    </a>
  );
}

export default function VideoCarousel({ matchInfo }: Props) {
  if (!matchInfo.video) return null;
  return (
    <div className="p-4 md:p-6 bg-white overflow-x-auto flex gap-4 no-scrollbar border-b border-slate-100">
      <VideoCard href={matchInfo.video} logoSrc={matchInfo.team1.logo} title="Tóm tắt về trận đấu" subtitle="YouTube Highlight" />
      <VideoCard href={matchInfo.video} logoSrc={matchInfo.team2.logo} title="Diễn biến chính" subtitle="YouTube Highlight" />
    </div>
  );
}
