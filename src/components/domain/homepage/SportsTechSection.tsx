import { VerticalPost } from "@/components/domain/article/VerticalPost";
import { HorizontalPost } from "@/components/domain/article/HorizontalPost";

export function SportsTechSection() {
  return (
    <section className="mb-4 md:mb-6 border-b border-[#e5e5e5] pb-4 md:pb-6">
      <div className="flex flex-wrap items-center border-b border-[#e5e5e5] mb-4 md:mb-5 bg-[#fcfcfc] px-4 py-3">
        <h2 className="text-[18px] font-bold text-[#222222] border-b-[2px] border-[var(--color-accent-main)] inline-block pb-3 -mb-[13px] mr-5">
          Công nghệ Thể thao
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-5">
          <VerticalPost href="#" title="Công nghệ bắt việt vị bán tự động thay đổi Ngoại hạng Anh thế nào?" excerpt="Hệ thống camera AI mới hứa hẹn giảm thời gian check VAR xuống chỉ còn vài giây, chấm dứt tranh cãi tẻ nhạt." size="lg" />
        </div>

        <div className="lg:col-span-3 flex flex-col space-y-4 md:space-y-6">
          <VerticalPost href="#" title="Áo đấu thông minh đo nhịp tim cầu thủ thời gian thực" size="sm" hideExcerpt imageClass="w-full" />
          <VerticalPost href="#" title="Cách siêu máy tính dự đoán kết quả Euro 2024" size="sm" hideExcerpt imageClass="w-full" />
        </div>

        <div className="lg:col-span-4 flex flex-col">
          {[1, 2, 3, 4].map(i => (
            <HorizontalPost key={i} href="#" title="Mắt kính thực tế ảo Apple Vision Pro được ứng dụng vào tập luyện thực tế" size="sm" hideExcerpt imageClass="w-[110px]" className="mb-4 md:mb-5 border-b border-[#e5e5e5] pb-4 md:pb-5 last:border-0 last:pb-0 last:mb-0" />
          ))}
        </div>
      </div>
    </section>
  );
}
