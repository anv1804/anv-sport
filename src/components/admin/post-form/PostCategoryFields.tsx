import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";

export function PostCategoryFields({
  metadata,
  handleMetadataChange,
  categoryOptions
}: {
  metadata: any;
  handleMetadataChange: (key: string, value: any) => void;
  categoryOptions: any[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <Label required>Nguồn tin</Label>
          <Select
            value={metadata.source || ""}
            onChange={(e) => handleMetadataChange('source', e.target.value)}
            error={!metadata.source}
          >
            <option value="">Chọn nguồn</option>
            <option value="ANV Sport">ANV Sport</option>
            <option value="CTV">Cộng tác viên</option>
            <option value="Tong hop">Tổng hợp</option>
          </Select>
          {!metadata.source && (
            <span className="text-xs text-amber-500 mt-1 block">Thông tin bắt buộc</span>
          )}
        </div>
        <div>
          <Label>Biểu tượng (icons)</Label>
          <Select
            value={metadata.icon || ""}
            onChange={(e) => handleMetadataChange('icon', e.target.value)}
          >
            <option value="">Chọn icon trên tiêu đề bài</option>
            <option value="HOT">🔥 Icon Hot (Ngọn lửa)</option>
            <option value="LIVE">🔴 Icon Live</option>
            <option value="NEW">✨ Icon New</option>
          </Select>
        </div>
        <div>
          <Label>Loại tin bài</Label>
          <Select
            value={metadata.postCategory || ""}
            onChange={(e) => handleMetadataChange('postCategory', e.target.value)}
          >
            <option value="">Chọn loại tin</option>
            <option value="STANDARD">Bài thường</option>
            <option value="VIDEO">Bài Video</option>
            <option value="EMAGAZINE">eMagazine</option>
            <option value="GALLERY">Tin ảnh</option>
            <option value="INFOGRAPHIC">Infographic</option>
          </Select>
        </div>
        <div>
          <Label required>Mục chính</Label>
          <Select
            value={metadata.mainCategory || ""}
            onChange={(e) => handleMetadataChange('mainCategory', e.target.value)}
            error={!metadata.mainCategory}
          >
            <option value="">Chọn mục chính</option>
            {categoryOptions.map(cat => (
              <option key={cat.id} value={cat.slug} className="text-slate-700 font-normal">
                {'  '.repeat(cat.depth)}{cat.depth > 0 ? '↳ ' : ''}{cat.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
