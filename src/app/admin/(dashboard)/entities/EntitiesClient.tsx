"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit2, Trash2, Search, Filter, Users, RefreshCw, Loader2 } from "lucide-react";
import { deleteEntity } from "./actions";
import toast from "react-hot-toast";
import Link from "next/link";
import { CustomSelect } from "@/components/admin/entity-form/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Pagination } from "@/components/ui/Pagination";

// --- TYPES ---
type EntityWithClub = {
  id: string;
  name: string;
  slug: string;
  type: string;
  avatar: string | null;
  club: { id: string; name: string } | null;
};

type ClubData = {
  id: string;
  name: string;
};

type EntitiesClientProps = {
  initialEntities: EntityWithClub[];
  initialClubs: ClubData[];
};

export default function EntitiesClient({ initialEntities, initialClubs }: EntitiesClientProps) {
  const confirm = useConfirm();
  // --- STATE ---
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [clubFilter, setClubFilter] = useState("");

  const initialPage = Number(searchParams.get("page")) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncPageToUrl = (newPage: number) => {
    if (typeof window !== 'undefined') {
      const current = new URLSearchParams(window.location.search);
      current.set("page", newPage.toString());
      const newUrl = `${window.location.pathname}?${current.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    syncPageToUrl(newPage);
  };

  const ITEMS_PER_PAGE = 15;

  // --- FILTER & PAGINATION ---
  const filteredEntities = useMemo(() => {
    return initialEntities.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.slug.includes(searchQuery.toLowerCase());
      const matchType = typeFilter && typeFilter !== 'ALL' ? e.type === typeFilter : true;
      const matchClub = clubFilter && clubFilter !== 'ALL' ? e.club?.id === clubFilter : true;
      return matchSearch && matchType && matchClub;
    });
  }, [initialEntities, searchQuery, typeFilter, clubFilter]);

  // Reset selectedIds when filters change
  useMemo(() => { setSelectedIds([]); }, [searchQuery, typeFilter, clubFilter]);

  const totalPages = Math.ceil(filteredEntities.length / ITEMS_PER_PAGE) || 1;
  const getPaginatedData = (data: any[]) => data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const currentPaginatedData = getPaginatedData(filteredEntities);

  // Derive available types
  const availableTypes = useMemo(() => {
    const types = new Set(initialEntities.map(e => e.type).filter(Boolean));
    return Array.from(types).map(t => ({
      value: t,
      label: t === 'FOOTBALL_PLAYER' ? 'Bóng đá' : t === 'BILLIARDS_PLAYER' ? 'Billiards' : t
    }));
  }, [initialEntities]);

  // --- HANDLERS ---
  const handleDelete = async (id: string) => {
    const ok = await confirm("Bạn có chắc chắn muốn xóa VĐV này?");
    if (!ok) return;
    try {
      await deleteEntity(id);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      toast.success("Đã xóa thành công");
    } catch (err) {
      toast.error("Không thể xóa. Đã có lỗi xảy ra.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const ok = await confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} VĐV đã chọn?`);
    if (!ok) return;
    
    setIsSubmitting(true);
    let successCount = 0;
    
    for (const id of selectedIds) {
      try {
        await deleteEntity(id);
        successCount++;
      } catch (err) {
        console.error("Delete failed for", id);
      }
    }
    
    if (successCount === selectedIds.length) {
      toast.success(`Đã xóa thành công ${successCount} mục`);
    } else {
      toast.error(`Đã xóa ${successCount}/${selectedIds.length} mục. Có lỗi xảy ra.`);
    }
    
    setSelectedIds([]);
    setIsSubmitting(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const paginatedIds = currentPaginatedData.map(item => item.id);
      setSelectedIds(paginatedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isAllSelected = currentPaginatedData.length > 0 && currentPaginatedData.every(item => selectedIds.includes(item.id));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-auto md:h-[calc(100vh-12rem)] min-h-0 md:min-h-[600px]">
      
      {/* TOOLBAR */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 flex-1 w-full">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm VĐV..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); handlePageChange(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); handlePageChange(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Filter className="w-4 h-4 shrink-0" />
              <span className="lg:hidden font-medium text-slate-500 text-xs">Bộ lọc:</span>
            </div>
            <div className="w-full sm:w-[160px]">
              <CustomSelect 
                options={[{value: 'ALL', label: 'Tất cả Môn'}, ...availableTypes]}
                value={typeFilter}
                onChange={(val) => { setTypeFilter(val); handlePageChange(1); }}
                placeholder="Tất cả Môn"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <CustomSelect 
                options={[{value: 'ALL', label: 'Tất cả CLB'}, ...initialClubs.map(c => ({value: c.id, label: c.name}))]}
                value={clubFilter}
                onChange={(val) => { setClubFilter(val); handlePageChange(1); }}
                placeholder="Tất cả CLB"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0">
          <button 
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="flex items-center justify-center gap-2 px-3 py-2 text-[13px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200 w-full sm:w-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-emerald-600' : ''}`} />
            Làm mới
          </button>
          
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap disabled:opacity-50 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" /> Xóa ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* TABLE & CARDS AREA */}
      <div className="flex-1 overflow-auto scrollbar-hide relative flex flex-col">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1.5px] z-20 flex items-center justify-center transition-all duration-300">
             <div className="flex flex-col items-center gap-3 bg-white/90 p-5 rounded-2xl shadow-xl border border-emerald-100">
               <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
               <span className="text-sm font-bold text-emerald-800">Đang tải dữ liệu...</span>
             </div>
          </div>
        )}

        {/* DESKTOP TABLE VIEW */}
        <table className="w-full text-left border-collapse min-w-[800px] hidden md:table">
          <thead className="bg-slate-50/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-5 w-12">
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
              </th>
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Cầu thủ / VĐV</th>
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Phân loại</th>
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Câu lạc bộ</th>
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentPaginatedData.map(e => (
              <tr key={e.id} className={`hover:bg-emerald-50/30 transition-colors ${selectedIds.includes(e.id) ? 'bg-emerald-50/50' : ''}`}>
                <td className="py-3 px-5">
                  <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleSelect(e.id)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer" />
                </td>
                <td className="py-3 px-5 flex items-center gap-3">
                  {e.avatar ? (
                    <img src={e.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-white" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200"></div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800">{e.name}</div>
                    <div className="text-[11px] text-slate-400">{e.slug}</div>
                  </div>
                </td>
                <td className="py-3 px-5">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">
                    {e.type === 'FOOTBALL_PLAYER' ? 'Bóng đá' : e.type === 'BILLIARDS_PLAYER' ? 'Billiards' : e.type}
                  </span>
                </td>
                <td className="py-3 px-5 text-sm font-bold text-slate-600">
                  {e.club ? e.club.name : <span className="text-slate-400 font-normal italic">Không có</span>}
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/entities/${e.id}/edit`} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Chỉnh sửa">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(e.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredEntities.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="w-12 h-12 text-slate-200 mb-3" />
                    <p>Không tìm thấy Cầu thủ / VĐV nào.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* MOBILE CARD VIEW */}
        <div className="block md:hidden divide-y divide-slate-100 flex-1 overflow-auto bg-slate-50/50">
          <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
              Chọn tất cả
            </label>
            <span className="text-xs text-slate-400 font-medium">Hiển thị {currentPaginatedData.length} VĐV</span>
          </div>

          {currentPaginatedData.map(e => (
            <div key={e.id} className={`p-4 flex flex-col gap-3 hover:bg-emerald-50/10 transition-colors bg-white ${selectedIds.includes(e.id) ? 'bg-emerald-50/30' : ''}`}>
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(e.id)} 
                  onChange={() => toggleSelect(e.id)} 
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer mt-1" 
                />
                
                {e.avatar ? (
                  <img src={e.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-white shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 shrink-0"></div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-[15px] truncate">{e.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{e.slug}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pl-7">
                <div>
                  <span className="font-medium text-slate-400 block mb-0.5">Phân loại</span>
                  <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold text-[10px]">
                    {e.type === 'FOOTBALL_PLAYER' ? 'Bóng đá' : e.type === 'BILLIARDS_PLAYER' ? 'Billiards' : e.type}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block mb-0.5">Câu lạc bộ</span>
                  <span className="text-slate-600 font-bold">
                    {e.club ? e.club.name : <span className="text-slate-400 font-normal italic">Không có</span>}
                  </span>
                </div>
              </div>

              {/* Actions for Mobile Card */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-2 pl-7 mt-1">
                <Link href={`/admin/entities/${e.id}/edit`} className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors font-bold" title="Chỉnh sửa">
                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                </Link>
                <button onClick={() => handleDelete(e.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-bold" title="Xóa">
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>
          ))}

          {filteredEntities.length === 0 && (
            <div className="py-12 text-center text-slate-500 bg-white">
              <div className="flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-slate-200 mb-3" />
                <p>Không tìm thấy Cầu thủ / VĐV nào.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredEntities.length}
        onPageChange={handlePageChange}
        hasSelectedItems={selectedIds.length > 0}
      />
    </div>
  );
}
