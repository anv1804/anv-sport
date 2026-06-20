import { ChevronDown } from "lucide-react";
import { SeoResult } from "@/lib/seo/evaluator";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

export function PostSeoFields({
  metadata,
  handleMetadataChange,
  seoResult
}: {
  metadata: any;
  handleMetadataChange: (key: string, value: any) => void;
  seoResult: SeoResult;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 text-lg flex items-center">
          Thông tin SEO
          <span className={`ml-2 w-7 h-7 text-white rounded-full text-[11px] font-bold flex items-center justify-center ${seoResult.score >= 80 ? 'bg-emerald-500' : seoResult.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
            {seoResult.score}
          </span>
        </h3>
        <div className="w-8 h-8 bg-[#26a69a] rounded text-white flex items-center justify-center cursor-pointer">❖</div>
      </div>

      <div className="space-y-4">
        <div>
          <Label required>SEO Tiêu đề</Label>
          <textarea
            value={metadata.seoTitle || ''}
            onChange={(e) => handleMetadataChange('seoTitle', e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            placeholder="SEO Tiêu đề"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-amber-500">Thông tin bắt buộc</span>
            <span className="text-xs bg-amber-400 text-white px-1.5 rounded">{(metadata.seoTitle || '').length}/60</span>
          </div>
        </div>
        <div>
          <Label required>SEO Mô tả</Label>
          <textarea
            value={metadata.seoDescription || ''}
            onChange={(e) => handleMetadataChange('seoDescription', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            placeholder="SEO Mô tả"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-amber-500">Thông tin bắt buộc</span>
            <span className="text-xs bg-amber-400 text-white px-1.5 rounded">{(metadata.seoDescription || '').length}/180</span>
          </div>
        </div>
        <div>
          <Label required>Từ khóa SEO</Label>
          <Input
            value={metadata.seoKeywords || ''}
            onChange={(e) => handleMetadataChange('seoKeywords', e.target.value)}
            type="text"
            placeholder="Nhập từ khóa tin SEO"
          />
          <span className="text-xs text-amber-500 mt-1 block">Thông tin bắt buộc</span>
        </div>
        <div>
          <Label>SEO Url</Label>
          <Input
            value={metadata.seoUrl || ''}
            onChange={(e) => handleMetadataChange('seoUrl', e.target.value)}
            type="text"
          />
        </div>

        {/* SEO CHECKS */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 mt-4">
          <h4 className="text-[13px] font-bold text-slate-700 mb-2">Đánh giá chuẩn SEO</h4>
          {seoResult.checks.map(check => (
            <div key={check.id} className="flex items-start gap-2 text-[12px] bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
              <span className="mt-0.5">
                {check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'}
              </span>
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">{check.label}</span>
                <span className={check.status === 'pass' ? 'text-emerald-600' : check.status === 'warning' ? 'text-amber-600' : 'text-red-600'}>
                  {check.message}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-2">
          <span className="text-sm font-bold text-slate-700">Thiết lập</span>
          <label className="flex items-center text-sm text-slate-700">
            <input type="checkbox" className="mr-2" checked={metadata.noIndex || false} onChange={(e) => handleMetadataChange('noIndex', e.target.checked)} /> No Index
          </label>
          <label className="flex items-center text-sm text-slate-700">
            <input type="checkbox" className="mr-2" checked={metadata.noFollow || false} onChange={(e) => handleMetadataChange('noFollow', e.target.checked)} /> No Follow
          </label>
        </div>

        <div className="pt-2">
          <label className="flex items-center text-sm font-bold text-[#1976d2] mb-2 cursor-pointer">
            Chọn loại Evergreen <ChevronDown className="w-4 h-4 ml-1" />
          </label>
          <div className="space-y-1">
            <label className="flex items-center text-sm text-slate-700"><input type="radio" name="evergreen" className="mr-2" /> Evergreen Hướng dẫn từng bước (HowTo)</label>
            <label className="flex items-center text-sm text-slate-700"><input type="radio" name="evergreen" className="mr-2" /> Evergreen Danh sách/Top (ItemList)</label>
            <label className="flex items-center text-sm text-slate-700"><input type="radio" name="evergreen" className="mr-2" /> Evergreen Kiến thức tổng quát</label>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" className="text-[#26a69a] border-[#26a69a] hover:bg-teal-50">
            <span className="mr-1">📊</span> Box Thăm dò
          </Button>
          <Button type="button" variant="outline" size="sm" className="text-[#26a69a] border-[#26a69a] hover:bg-teal-50">
            <span className="mr-1">📋</span> Khảo sát
          </Button>
        </div>
      </div>
    </div>
  );
}
