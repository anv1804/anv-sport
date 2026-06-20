import Link from "next/link";
import { Play } from "lucide-react";

interface PodcastCardProps {
  href: string;
  title: string;
  duration: string;
}

export function PodcastCard({ href, title, duration }: PodcastCardProps) {
  return (
    <Link href={href} className="flex flex-col group cursor-pointer">
      <div className="w-full aspect-[16/9] bg-[#e5e5e5] relative mb-3 overflow-hidden">
        <div className="absolute inset-0 bg-[#e5e5e5] group-hover:scale-105 transition-transform duration-300"></div>
        {/* Play Button Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-bold px-2 py-1 flex items-center rounded-sm">
           <Play className="w-3 h-3 fill-white mr-1" /> {duration}
        </div>
      </div>
      <h3 className="text-[15px] font-bold text-[#222222] leading-[1.4] group-hover:text-[var(--color-accent-main)] transition-colors line-clamp-2">
        {title}
      </h3>
    </Link>
  );
}
