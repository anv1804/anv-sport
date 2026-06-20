import { CategoryColumn } from "@/components/shared/widgets/CategoryColumn";
import { AdBanner } from "@/components/shared/ads/AdBanner";

type BottomSectionProps = {
  adBottomRightSlot?: string;
};

export function BottomSection({ adBottomRightSlot }: BottomSectionProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
      <CategoryColumn
        title="Tin nổi bật"
        href="#"
        heroArticle={{ title: "Tuyển nữ Việt Nam xuất sắc giành vé dự World Cup", excerpt: "Chiến thắng quả cảm trước Đài Loan giúp thầy trò HLV Mai Đức Chung làm nên lịch sử.", href: "#" }}
        listArticles={[{ title: "HLV Mai Đức Chung: 'Đó là tinh thần Việt Nam'", href: "#" }]}
      />
      <CategoryColumn
        title="Quốc tế"
        href="#"
        heroArticle={{ title: "Kylian Mbappe chính thức ra mắt Real Madrid", excerpt: "Hàng chục nghìn khán giả đã lấp kín sân Bernabeu để chào đón siêu sao người Pháp.", href: "#" }}
        listArticles={[{ title: "Mbappe mặc áo số 9, đặt mục tiêu vô địch Champions League", href: "#" }]}
      />
      <div>
        <AdBanner type="rectangle" adSlot={adBottomRightSlot || "Bottom_Right_Tall"} imageUrl="/ad-rectangle.png" />
      </div>
    </section>
  );
}
