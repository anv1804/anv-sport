"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit2, Trash2, Search, Filter, Shield, RefreshCw, Loader2 } from "lucide-react";
import { deleteClub, deleteMultipleClubs, syncClubs } from "./actions";
import toast from "react-hot-toast";
import Link from "next/link";
import { CustomSelect } from "@/components/admin/entity-form/CustomSelect";
import SyncClubProgressModal from "@/components/admin/SyncClubProgressModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";

// --- TYPES ---
type ClubData = {
  id: string;
  name: string;
  slug: string;
  sportType: string;
  logo: string | null;
  countryId: string | null;
  leagueId: string | null;
  _count: {
    entities: number;
  };
};

type ClubsClientProps = {
  initialClubs: ClubData[];
  initialCountries: any[];
  initialLeagues: any[];
  initialSports: any[];
};

export default function ClubsClient({ initialClubs, initialCountries, initialLeagues, initialSports }: ClubsClientProps) {
  // --- STATE ---
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("");
  
  const initialPage = Number(searchParams.get("page")) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);

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
  const filteredClubs = useMemo(() => {
    return initialClubs.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.slug.includes(searchQuery.toLowerCase());
      const matchType = typeFilter && typeFilter !== 'ALL' ? c.sportType === typeFilter : true;
      const matchCountry = countryFilter && countryFilter !== 'ALL' ? c.countryId === countryFilter : true;
      const matchLeague = leagueFilter && leagueFilter !== 'ALL' ? c.leagueId === leagueFilter : true;
      return matchSearch && matchType && matchCountry && matchLeague;
    });
  }, [initialClubs, searchQuery, typeFilter, countryFilter, leagueFilter]);

  // Reset selectedIds when filters change
  useMemo(() => { setSelectedIds([]); }, [searchQuery, typeFilter, countryFilter, leagueFilter]);

  const totalPages = Math.ceil(filteredClubs.length / ITEMS_PER_PAGE) || 1;
  const getPaginatedData = (data: any[]) => data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const currentPaginatedData = getPaginatedData(filteredClubs);

  // Derive available types
  const availableTypes = useMemo(() => {
    const types = new Set(initialClubs.map(c => c.sportType).filter(Boolean));
    return Array.from(types).map(t => ({
      value: t,
      label: t === 'FOOTBALL' ? 'Bóng đá' : t === 'BILLIARDS' ? 'Billiards' : t
    }));
  }, [initialClubs]);

  const availableCountries = useMemo(() => {
    if (!typeFilter || typeFilter === 'ALL') return [];
    const sportSlug = typeFilter === 'FOOTBALL' ? 'bong-da' : typeFilter === 'BILLIARDS' ? 'bida' : null;
    const sport = initialSports.find(s => s.slug === sportSlug);
    if (!sport) return [];
    
    const countryIds = new Set(initialLeagues.filter(l => l.sportId === sport.id).map(l => l.countryId).filter(Boolean));
    return initialCountries.filter(c => countryIds.has(c.id));
  }, [typeFilter, initialSports, initialLeagues, initialCountries]);

  const availableLeagues = useMemo(() => {
    if (!countryFilter || countryFilter === 'ALL') return [];
    return initialLeagues.filter(l => l.countryId === countryFilter);
  }, [countryFilter, initialLeagues]);

  // --- HANDLERS ---
  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteClub(deleteTarget);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== deleteTarget));
      toast.success("Đã xóa thành công");
    } catch (err) {
      toast.error("Không thể xóa. Đã có lỗi xảy ra.");
    }
    setDeleteTarget(null);
    setIsSubmitting(false);
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    setBulkDeleteTarget(true);
  };

  const confirmBulkDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteMultipleClubs(selectedIds);
      toast.success(`Đã xóa thành công ${selectedIds.length} mục`);
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk delete failed", err);
      toast.error("Có lỗi xảy ra khi xóa hàng loạt.");
    }
    setBulkDeleteTarget(false);
    setIsSubmitting(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allFilteredIds = filteredClubs.map(item => item.id);
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSync = () => {
    if (!selectedIds.length) return;
    setShowSyncModal(true);
  };

  const isAllSelected = filteredClubs.length > 0 && selectedIds.length === filteredClubs.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[600px]">
      
      {/* TOOLBAR */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm CLB..."
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
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <div className="w-[160px]">
              <CustomSelect 
                options={[{value: 'ALL', label: 'Tất cả Môn'}, ...availableTypes]}
                value={typeFilter}
                onChange={(val) => { 
                  setTypeFilter(val); 
                  setCountryFilter(""); 
                  setLeagueFilter(""); 
                  handlePageChange(1); 
                }}
                placeholder="Tất cả Môn"
              />
            </div>
            
            {availableCountries.length > 0 && (
              <div className="w-[160px]">
                <CustomSelect 
                  options={[{value: 'ALL', label: 'Tất cả Quốc gia'}, ...availableCountries.map(c => ({value: c.id, label: c.name}))]}
                  value={countryFilter}
                  onChange={(val) => { 
                    setCountryFilter(val); 
                    setLeagueFilter(""); 
                    handlePageChange(1); 
                  }}
                  placeholder="Quốc gia"
                />
              </div>
            )}

            {availableLeagues.length > 0 && (
              <div className="w-[180px]">
                <CustomSelect 
                  options={[{value: 'ALL', label: 'Tất cả Giải đấu'}, ...availableLeagues.map(l => ({value: l.id, label: l.name}))]}
                  value={leagueFilter}
                  onChange={(val) => { setLeagueFilter(val); handlePageChange(1); }}
                  placeholder="Giải đấu"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-emerald-600' : ''}`} />
            Làm mới
          </button>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSync}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" /> Đồng bộ ({selectedIds.length})
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Xóa ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1.5px] z-20 flex items-center justify-center transition-all duration-300">
             <div className="flex flex-col items-center gap-3 bg-white/90 p-5 rounded-2xl shadow-xl border border-emerald-100">
               <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
               <span className="text-sm font-bold text-emerald-800">Đang tải dữ liệu...</span>
             </div>
          </div>
        )}
        <table className="w-full text-left border-collapse min-w-[800px]">
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
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Câu lạc bộ</th>
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Môn thể thao</th>
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Thành viên</th>
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentPaginatedData.map(c => (
              <tr key={c.id} className={`hover:bg-emerald-50/30 transition-colors ${selectedIds.includes(c.id) ? 'bg-emerald-50/50' : ''}`}>
                <td className="py-3 px-5">
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer" />
                </td>
                <td className="py-3 px-5 flex items-center gap-3">
                  {c.logo ? (
                    <img src={c.logo} className="w-10 h-10 rounded-md object-contain border border-slate-200 bg-white p-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase text-center leading-tight p-1">No Logo</div>
                  )}
                  <div>
                    <Link href={`/admin/clubs/${c.id}/edit`} className="font-bold text-slate-800 hover:text-emerald-600 hover:underline">{c.name}</Link>
                    <div className="text-[11px] text-slate-400">{c.slug}</div>
                  </div>
                </td>
                <td className="py-3 px-5 text-center">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">
                    {c.sportType === 'FOOTBALL' ? 'Bóng đá' : c.sportType === 'BILLIARDS' ? 'Billiards' : c.sportType}
                  </span>
                </td>
                <td className="py-3 px-5 text-center font-bold text-slate-700">
                  {c._count.entities} <span className="font-normal text-slate-400 text-xs ml-1">người</span>
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/clubs/${c.id}/edit`} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Chỉnh sửa">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredClubs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Shield className="w-12 h-12 text-slate-200 mb-3" />
                    <p>Không tìm thấy Câu lạc bộ nào.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredClubs.length}
        onPageChange={handlePageChange}
        hasSelectedItems={selectedIds.length > 0}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Đang xóa..." : "Xóa"}
            </Button>
          </>
        }
      >
        <p className="text-slate-600 text-[15px]">Bạn có chắc chắn muốn xóa Câu lạc bộ này không? Hành động này không thể hoàn tác.</p>
      </Modal>

      <Modal
        isOpen={bulkDeleteTarget}
        onClose={() => setBulkDeleteTarget(false)}
        title="Xác nhận xóa hàng loạt"
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkDeleteTarget(false)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Đang xóa..." : `Xóa ${selectedIds.length} mục`}
            </Button>
          </>
        }
      >
        <p className="text-slate-600 text-[15px]">Bạn có chắc chắn muốn xóa {selectedIds.length} Câu lạc bộ đã chọn không? Hành động này không thể hoàn tác.</p>
      </Modal>

      <SyncClubProgressModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        selectedClubs={initialClubs.filter((c: ClubData) => selectedIds.includes(c.id)).map((c: ClubData) => ({ id: c.id, name: c.name }))}
        onComplete={() => {
          setSelectedIds([]);
        }}
      />
    </div>
  );
}
