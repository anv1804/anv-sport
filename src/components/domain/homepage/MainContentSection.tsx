import { NewsFeed } from "@/components/shared/widgets/NewsFeed";
import { AdBanner } from "@/components/shared/ads/AdBanner";
import { DynamicCategoryBlock } from "@/components/shared/widgets/DynamicCategoryBlock";
import { CategoryBlockConfig } from "@/types/page";

type MainContentSectionProps = {
  newsFeedZoneId?: string;
  categoryBlocks?: (CategoryBlockConfig | string)[];
  adInFeedSlot?: string;
};

export function MainContentSection({ newsFeedZoneId, categoryBlocks = [], adInFeedSlot }: MainContentSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-4 md:mb-6">

      {/* CỘT TRÁI (Luồng tin chính) - 4 Cột */}
      <div className="lg:col-span-4 lg:border-r border-[#e5e5e5] md:pr-6">
        <NewsFeed zoneId={newsFeedZoneId} />
        <div className="pb-4 md:pb-5 mb-4 md:mb-5 mt-4 md:mt-6">
          <AdBanner type="responsive" adSlot={adInFeedSlot || "In_Feed_Left"} className="h-[250px]" />
        </div>
      </div>

      {/* CỘT PHẢI (Category Blocks) - 8 Cột */}
      <div className="lg:col-span-8">

        {/* Banner Thể thao ngang */}
        <div className="bg-[#f7f7f7] border-t-[3px] border-[var(--color-accent-main)] px-5 py-3 mb-4 md:mb-6 flex items-center justify-between">
          <div className="font-bold text-[16px] text-[var(--color-accent-main)] uppercase tracking-wide">Lịch thi đấu</div>
          <div className="flex space-x-5">
            <span className="text-[14px] text-[#222222] cursor-pointer hover:text-[var(--color-accent-main)] transition-colors">Bảng xếp hạng</span>
            <span className="text-[14px] text-[#222222] cursor-pointer hover:text-[var(--color-accent-main)] transition-colors">Dự đoán</span>
          </div>
        </div>

        {/* CATEGORY BLOCKS DYNAMIC */}
        {Array.isArray(categoryBlocks) && categoryBlocks.filter(Boolean).map((block, idx) => {
          const zoneId = typeof block === 'object' ? (block as CategoryBlockConfig).id : block;
          const isSticky = typeof block === 'object' ? (block as CategoryBlockConfig).isSticky : false;
          const layoutType = typeof block === 'object' && (block as CategoryBlockConfig).layout !== undefined
            ? (block as CategoryBlockConfig).layout!
            : (idx % 3);
          return <DynamicCategoryBlock key={idx} zoneId={zoneId} isSticky={isSticky} index={layoutType} />;
        })}

      </div>
    </section>
  );
}
