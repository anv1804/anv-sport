import prisma from "@/lib/prisma";
import Link from "next/link";

interface AdBannerProps {
  type: "leaderboard" | "rectangle" | "responsive";
  className?: string;
  adSlot?: string;
  imageUrl?: string;
}

export async function AdBanner({ type, className = "", adSlot, imageUrl: propImageUrl }: AdBannerProps) {
  let finalImageUrl = propImageUrl;
  let finalLinkUrl = null;

  if (adSlot && !propImageUrl) {
    const dbAd = await prisma.adPlacement.findUnique({ where: { slotId: adSlot } });
    if (dbAd) {
      if (!dbAd.isActive) return null;
      finalImageUrl = dbAd.imageUrl || undefined;
      finalLinkUrl = dbAd.linkUrl;
    }
  }

  const typeClasses = {
    leaderboard: "w-full h-[120px] md:h-[200px] mx-auto",
    rectangle: "w-full h-[250px] lg:h-[600px] mx-auto",
    responsive: "w-full min-h-[100px]",
  };

  const adContent = (
    <div className={`relative flex flex-col items-center justify-center bg-[#f0f0f0] border border-[#e5e5e5] text-center overflow-hidden group ${typeClasses[type]} ${className}`}>
      {finalImageUrl ? (
        <>
           <img src={finalImageUrl} alt={`Advertisement ${adSlot || ''}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
             <span className="text-[var(--color-accent-main)] font-bold text-[14px] mb-2 uppercase tracking-wide">Liên hệ quảng cáo</span>
             <span className="text-white text-[13px] mb-1 font-mono">nguyenan18404@gmail.com</span>
             <span className="text-white text-[13px] font-mono">0965 064 241</span>
           </div>
           {/* Ad label in corner */}
           <span className="absolute top-0 right-0 bg-[#f2f2f2] text-[#999] text-[9px] px-1.5 py-0.5 uppercase z-20">Quảng cáo</span>
        </>
      ) : (
        <div className="p-4 flex flex-col items-center justify-center h-full w-full">
          <span className="text-[#a0a0a0] font-bold uppercase tracking-widest text-[11px] mb-1">
            Advertisement
          </span>
          {adSlot && (
            <span className="text-[#cccccc] text-[10px] uppercase font-mono tracking-wider mb-4">
              {adSlot}
            </span>
          )}
          <div className="mt-2 text-[#999] text-[12px] border-t border-[#e5e5e5] pt-3 flex flex-col gap-1">
             <span className="font-bold text-[11px] uppercase tracking-wide text-[#757575]">Liên hệ quảng cáo</span>
             <span className="font-mono">nguyenan18404@gmail.com</span>
             <span className="font-mono">0965 064 241</span>
          </div>
        </div>
      )}
    </div>
  );

  if (finalLinkUrl) {
    return (
      <Link href={finalLinkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
        {adContent}
      </Link>
    );
  }

  return adContent;
}
