import { HorizontalPost } from "@/components/domain/article/HorizontalPost";
import { VerticalPost } from "@/components/domain/article/VerticalPost";
import { AdBanner } from "@/components/shared/ads/AdBanner";
import { createArticleUrl } from "@/lib/helpers/url";
import { PostCard } from "@/types/post";

type HeroSectionProps = {
  mainPost: PostCard | null;
  subPosts: PostCard[];
  adTopRightSlot?: string;
};

export function HeroSection({ mainPost, subPosts, adTopRightSlot }: HeroSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 border-b border-[#e5e5e5] pb-4 md:pb-6 mb-4 md:mb-6 pt-4 md:pt-0">

      {/* Nội dung chính bên trái (9 Cột) */}
      <div className="lg:col-span-9 lg:border-r border-[#e5e5e5] md:pr-6">
        {mainPost ? (
          <HorizontalPost
            href={createArticleUrl(mainPost.title, mainPost.id)}
            title={mainPost.title}
            excerpt={mainPost.excerpt || undefined}
            imageUrl={mainPost.imageUrl || undefined}
            size="hero"
            titlePosition="side"
            className="flex-col md:flex-row"
            imageClass="w-full md:w-[66%] md:mr-6 mb-4 md:mb-0"
            eager={true}
          />
        ) : (
          <HorizontalPost
            href="/blog/pep-guardiola-3241"
            title="Giải mã sơ đồ 3-2-4-1 của Pep Guardiola: Đỉnh cao kiểm soát hay sự tiến hóa bắt buộc?"
            excerpt="Hệ thống chiến thuật giúp Manchester City giành cú ăn 3 lịch sử không phải là một phát kiến bất chợt. Đó là sự kế thừa từ Johan Cruyff và những tinh chỉnh điên rồ của một vị tướng ám ảnh bởi sự hoàn hảo."
            size="hero"
            titlePosition="side"
            className="flex-col md:flex-row"
            imageClass="w-full md:w-[66%] md:mr-6 mb-4 md:mb-0"
            eager={true}
          />
        )}

      {/* Ghi chú: Chừa đường kẻ nhỏ */}
        <hr className="my-4 md:my-5 border-[#e5e5e5]" />

        {/* Mobile: compact horizontal list */}
        <div className="block md:hidden mt-4 space-y-4">
          {subPosts.length > 0 ? (
            subPosts.map((post, idx) => (
              <div key={post.id} className={idx < subPosts.length - 1 ? "border-b border-[#e5e5e5] pb-4" : ""}>
                <HorizontalPost
                  href={createArticleUrl(post.title, post.id)}
                  title={post.title}
                  imageUrl={post.imageUrl || undefined}
                  size="sm"
                  titlePosition="side"
                  hideExcerpt={true}
                  imageClass="w-[120px] h-[75px]"
                />
              </div>
            ))
          ) : (
            <>
              <div className="border-b border-[#e5e5e5] pb-4">
                <HorizontalPost href="/mma/ufc-300-alex-pereira" title="Quét radar tìm ba rãnh mộ tập thể ở công viên Lê Thị Riêng" titlePosition="side" size="sm" hideExcerpt={true} imageClass="w-[120px] h-[75px]" />
              </div>
              <div className="border-b border-[#e5e5e5] pb-4">
                <HorizontalPost href="/football/thuy-dien-tunisia" title="Thụy Điển 3-1 Tunisia (H2): Isak kiến tạo cho Gyokeres ghi bàn" isLive={true} titlePosition="side" size="sm" hideExcerpt={true} imageClass="w-[120px] h-[75px]" />
              </div>
              <div>
                <HorizontalPost href="/opinion/cai-tao-ho-tay" title="Cải tạo Hồ Tây cho ai?" category="Góc nhìn" titlePosition="side" size="sm" hideExcerpt={true} imageClass="w-[120px] h-[75px]" />
              </div>
            </>
          )}
        </div>

        {/* Desktop & Tablet: vertical cards grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 md:gap-6">
          {subPosts.length > 0 ? (
            subPosts.map((post) => (
              <VerticalPost
                key={post.id}
                href={createArticleUrl(post.title, post.id)}
                title={post.title}
                imageUrl={post.imageUrl || undefined}
                titlePosition="top"
                size="md"
              />
            ))
          ) : (
            <>
              <VerticalPost href="/mma/ufc-300-alex-pereira" title="Quét radar tìm ba rãnh mộ tập thể ở công viên Lê Thị Riêng" titlePosition="top" size="md" />
              <VerticalPost href="/football/thuy-dien-tunisia" title="Thụy Điển 3-1 Tunisia (H2): Isak kiến tạo cho Gyokeres ghi bàn" isLive={true} titlePosition="top" size="md" />
              <VerticalPost href="/opinion/cai-tao-ho-tay" title="Cải tạo Hồ Tây cho ai?" excerpt="Hồ Tây hiện đại hơn, hay sẽ mất đi điều quý giá nhất của mình sau cải tạo?" category="Góc nhìn" author={{ name: "Tô Kiên" }} commentsCount={52} titlePosition="top" size="md" />
            </>
          )}
        </div>
      </div>

      {/* Cột phải QC Top (3 Cột) */}
      <div className="lg:col-span-3">
        <AdBanner type="rectangle" adSlot={adTopRightSlot || "Top_Right_Banner"} className="h-[250px] lg:h-[500px]" imageUrl="/ad-rectangle.png" />
      </div>
    </section>
  );
}
