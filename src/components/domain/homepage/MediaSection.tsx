import { VideoShortCard } from "@/components/domain/article/VideoShortCard";
import { PodcastCard } from "@/components/domain/article/PodcastCard";

export function MediaSection() {
  return (
    <>
      {/* VIDEO SHORTS */}
      <section className="mb-4 md:mb-6 border-b border-[#e5e5e5] pb-4 md:pb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <VideoShortCard href="#" title="Những pha xử lý bóng ma thuật của Messi tại Copa America" views="1.5M" category="Bóng đá" />
          <VideoShortCard href="#" title="Buổi tập đẫm mồ hôi của đội tuyển bóng chuyền nữ Việt Nam" views="850K" category="Thể thao" />
          <VideoShortCard href="#" title="Cú đánh uy lực của Carlos Alcaraz" views="2.1M" category="Tennis" />
          <VideoShortCard href="#" title="Màn lội ngược dòng khó tin ở giây cuối" views="500K" category="Bóng rổ" />
          <VideoShortCard href="#" title="Pha knock-out kinh điển tại UFC" views="3.2M" category="Võ thuật" />
        </div>
      </section>

      {/* PODCASTS */}
      <section className="mb-4 md:mb-6 border-b border-[#e5e5e5] pb-4 md:pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          <PodcastCard href="#" title="Vì sao Manchester United liên tục thất bại trên thị trường chuyển nhượng?" duration="1:15:20" />
          <PodcastCard href="#" title="Bí mật đằng sau chế độ dinh dưỡng của các VĐV Olympic" duration="45:12" />
          <PodcastCard href="#" title="Chuyện chưa kể về nghề Trọng tài V-League" duration="55:00" />
          <PodcastCard href="#" title="Phân tích chiến thuật: Xu hướng bóng đá thế giới 2024" duration="1:05:30" />
        </div>
      </section>
    </>
  );
}
