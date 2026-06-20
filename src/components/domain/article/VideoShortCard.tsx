import Link from "next/link";
import { Play } from "lucide-react";

interface VideoShortCardProps {
  href: string;
  title: string;
  views: string;
  category?: string;
}

export function VideoShortCard({ href, title, views, category }: VideoShortCardProps) {
  return (
    <Link href={href} className="flex flex-col group cursor-pointer relative w-full aspect-[9/16] bg-[#222] overflow-hidden rounded-md">
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-[#333] transition-transform duration-500 group-hover:scale-105"></div>
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      
      {/* Play Icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 border border-white/30 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
        <Play className="w-5 h-5 text-white fill-white ml-1" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 p-3 w-full">
        {category && <span className="text-[10px] font-bold text-white uppercase bg-[var(--color-accent-main)] px-1 py-[2px] mb-2 inline-block rounded-sm">{category}</span>}
        <h3 className="text-[14px] font-bold text-white leading-[1.3] mb-1 line-clamp-3 group-hover:text-[var(--color-accent-main)] transition-colors">
          {title}
        </h3>
        <p className="text-[12px] text-gray-300 font-medium">{views} views</p>
      </div>
    </Link>
  );
}
