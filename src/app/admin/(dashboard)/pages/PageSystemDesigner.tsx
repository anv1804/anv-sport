import { useMemo } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { CategorySearchSelect } from '@/components/ui/CategorySearchSelect';
import { Pin } from 'lucide-react';

type PageSystemDesignerProps = {
  settings: string;
  setSettingsWithDirty: (val: string) => void;
  availableZones: any[];
  availableAds: any[];
  availableCategories: any[];
  filteredZones: any[];
};

export function PageSystemDesigner({
  settings,
  setSettingsWithDirty,
  availableZones,
  availableAds,
  availableCategories,
  filteredZones
}: PageSystemDesignerProps) {

  const memoizedCategoryOptions = useMemo(() => {
    const childrenMap = new Map<string | null, any[]>();
    for (const cat of availableCategories) {
      const pId = cat.parentId || null;
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId)!.push(cat);
    }

    const buildHierarchyFast = (parentId: string | null = null, level: number = 0): any[] => {
      let res: any[] = [];
      const children = childrenMap.get(parentId) || [];
      for (const child of children) {
        res.push({
          id: `category:${child.id}`,
          name: child.name,
          depth: level,
          group: 'Danh mục tự động (Category)',
          isActive: child.isActive
        });
        res = res.concat(buildHierarchyFast(child.id, level + 1));
      }
      return res;
    };
    
    const cats = buildHierarchyFast(null).filter(c => c.isActive !== false);
    const zones = filteredZones.map(z => ({ id: z.id, name: z.name, depth: 0, group: 'Tùy chỉnh (Zone)' }));
    return [...zones, ...cats];
  }, [availableCategories, filteredZones]);

  const handleSlotChange = (slotKey: string, zoneId: string) => {
    try {
      const current = JSON.parse(settings || '{}');
      if (zoneId) {
        current[slotKey] = zoneId;
      } else {
        delete current[slotKey];
      }
      setSettingsWithDirty(JSON.stringify(current, null, 2));
    } catch (e) {
      const current = { [slotKey]: zoneId };
      setSettingsWithDirty(JSON.stringify(current, null, 2));
    }
  };

  const adOptions = useMemo(() => availableAds.filter(a => a.isActive).map(a => ({ value: a.slotId, label: a.name })), [availableAds]);
  const zoneOptions = useMemo(() => filteredZones.map(z => ({ value: z.id, label: z.name })), [filteredZones]);

  const renderSelector = (key: string, label: string, type: 'ZONE' | 'AD', colSpanClass: string) => {
    let currentConfig: any = {};
    try { currentConfig = JSON.parse(settings || '{}'); } catch(e) {}
    
    const isAd = type === 'AD';
    const bgClass = isAd ? 'bg-orange-50/50 border-orange-200' : 'bg-emerald-50/50 border-emerald-200';
    const titleClass = isAd ? 'text-orange-700' : 'text-emerald-700';

    if (isAd) {
      return (
        <div className={`p-3 rounded-xl border shadow-sm flex flex-col ${bgClass} ${colSpanClass}`}>
          <label className={`block text-xs font-bold mb-2 truncate ${titleClass}`} title={label}>{label}</label>
          <SearchableSelect 
            options={adOptions}
            value={currentConfig[key] || ''}
            onChange={(val) => handleSlotChange(key, val)}
            placeholder="-- Không gán Quảng Cáo --"
          />
        </div>
      );
    }

    // ZONE slots: cho phép chọn Zone hoặc Category
    return (
      <div className={`p-3 rounded-xl border shadow-sm flex flex-col ${bgClass} ${colSpanClass}`}>
        <label className={`block text-xs font-bold mb-2 truncate ${titleClass}`} title={label}>{label}</label>
        <CategorySearchSelect
          options={memoizedCategoryOptions}
          value={currentConfig[key] || ''}
          onChange={(val) => handleSlotChange(key, val)}
          placeholder="-- Chọn Zone hoặc Danh mục --"
        />
      </div>
    );
  };

  let currentConfig: any = {};
  try { currentConfig = JSON.parse(settings || '{}'); } catch(e) {}
  const categoryBlocks: any[] = Array.isArray(currentConfig.category_blocks) 
    ? currentConfig.category_blocks 
    : [];

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">
        Mô phỏng Giao diện Trang chủ (Gắn Zone)
      </label>
      <div className="grid grid-cols-12 gap-3 bg-slate-100 p-4 rounded-xl border border-slate-200">
        {/* Row 1 */}
        {renderSelector('top_section', 'Tiêu điểm (Trên cùng)', 'ZONE', 'col-span-12 md:col-span-9')}
        {renderSelector('ad_top_right', 'Banner Cạnh Tiêu điểm', 'AD', 'col-span-12 md:col-span-3')}
        
        {/* Row 2 */}
        {renderSelector('news_feed', 'Luồng tin chính (Cột trái)', 'ZONE', 'col-span-12 md:col-span-4')}
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-slate-200/50 p-2 rounded-lg">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Các Chuyên mục (Cột phải)</label>
              <button 
                type="button"
                onClick={() => {
                  const newConfig = { ...currentConfig, category_blocks: [...categoryBlocks, ''] };
                  setSettingsWithDirty(JSON.stringify(newConfig, null, 2));
                }}
                className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-200 transition-colors flex items-center gap-1"
              >
                + Thêm
              </button>
            </div>
            
            {categoryBlocks.length === 0 && (
              <div className="text-xs text-slate-400 italic text-center p-6 border border-dashed border-slate-300 rounded-xl bg-white/50">
                Chưa có chuyên mục nào. Bấm nút Thêm để tạo khối chuyên mục mới.
              </div>
            )}

            {categoryBlocks.map((block: any, idx: number) => {
              const zoneId = typeof block === 'object' ? block.id : block;
              const isSticky = typeof block === 'object' ? block.isSticky : false;
              const layout = typeof block === 'object' && block.layout !== undefined ? block.layout : (idx % 3);

              return (
              <div key={idx} className="p-3 rounded-xl border shadow-sm bg-emerald-50/50 border-emerald-200 relative group transition-all">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-emerald-700">Chuyên mục {idx + 1}</label>
                  <div className="flex items-center gap-1.5">
                    <SearchableSelect 
                      value={layout.toString()}
                      size="sm"
                      onChange={(val) => {
                        const newBlocks = [...categoryBlocks];
                        newBlocks[idx] = { 
                          id: zoneId, 
                          isSticky, 
                          layout: parseInt(val) 
                        };
                        const newConfig = { ...currentConfig, category_blocks: newBlocks };
                        setSettingsWithDirty(JSON.stringify(newConfig, null, 2));
                      }}
                      options={[
                        { value: "0", label: "Kiểu 1" },
                        { value: "1", label: "Kiểu 2" },
                        { value: "2", label: "Kiểu 3" }
                      ]}
                      className="w-[85px] mr-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newBlocks = [...categoryBlocks];
                        newBlocks[idx] = { id: zoneId, isSticky: !isSticky, layout };
                        const newConfig = { ...currentConfig, category_blocks: newBlocks };
                        setSettingsWithDirty(JSON.stringify(newConfig, null, 2));
                      }}
                      className={`p-1.5 rounded-md transition-colors ${isSticky ? 'bg-emerald-600 text-white shadow-inner' : 'bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-100'}`}
                      title={isSticky ? 'Bỏ ghim' : 'Ghim khối này (Sticky)'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const newBlocks = categoryBlocks.filter((_, i) => i !== idx);
                        const newConfig = { ...currentConfig, category_blocks: newBlocks };
                        setSettingsWithDirty(JSON.stringify(newConfig, null, 2));
                      }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors bg-white shadow-sm"
                      title="Xóa chuyên mục này"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
                <CategorySearchSelect 
                  options={memoizedCategoryOptions}
                  value={zoneId || ''}
                  onChange={(val) => {
                    const newBlocks = [...categoryBlocks];
                    newBlocks[idx] = { id: val, isSticky, layout };
                    const newConfig = { ...currentConfig, category_blocks: newBlocks };
                    setSettingsWithDirty(JSON.stringify(newConfig, null, 2));
                  }}
                  placeholder="-- Chọn Zone hoặc Danh mục --"
                />
              </div>
              );
            })}
          </div>
        </div>

        {/* Row 3 - Ad Middle */}
        {renderSelector('ad_middle', 'Quảng cáo Giữa trang (Leaderboard)', 'AD', 'col-span-12')}

        {/* Row 4 */}
        {renderSelector('horizontal_block', 'Khối bài ngang (Công nghệ)', 'ZONE', 'col-span-12')}

        {/* Row 5 */}
        {renderSelector('video_shorts', 'Khối Video Shorts', 'ZONE', 'col-span-12')}

        {/* Row 6 */}
        {renderSelector('podcasts', 'Khối Podcasts', 'ZONE', 'col-span-12')}

        {/* Row 7 */}
        {renderSelector('bottom_col_1', 'Cột nổi bật dưới cùng 1', 'ZONE', 'col-span-12 md:col-span-4')}
        {renderSelector('bottom_col_2', 'Cột nổi bật dưới cùng 2', 'ZONE', 'col-span-12 md:col-span-4')}
        {renderSelector('ad_bottom_right', 'Quảng cáo Góc Dưới', 'AD', 'col-span-12 md:col-span-4')}
      </div>
    </div>
  );
}
