"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Edit2, Trash2, Globe, Medal, Trophy, Search, Filter, Database } from "lucide-react";
import { createSport, updateSport, deleteSport, createCountry, updateCountry, deleteCountry, createLeague, updateLeague, deleteLeague } from "./actions";
import { toast } from "react-hot-toast";
import { CustomSelect } from "@/components/admin/entity-form/CustomSelect";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Pagination } from "@/components/ui/Pagination";

type Tab = "SPORTS" | "COUNTRIES" | "LEAGUES";

const PAGE_SIZE = 15;

export default function GeneralDataClient({ 
  initialSports, 
  initialCountries, 
  initialLeagues 
}: { 
  initialSports: any[]; 
  initialCountries: any[]; 
  initialLeagues: any[]; 
}) {
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("SPORTS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const initialPage = Number(searchParams.get("page")) || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [leagueSportFilter, setLeagueSportFilter] = useState("");
  const [leagueCountryFilter, setLeagueCountryFilter] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [sportModal, setSportModal] = useState({ isOpen: false, data: null as any });
  const [countryModal, setCountryModal] = useState({ isOpen: false, data: null as any });
  const [leagueModal, setLeagueModal] = useState({ isOpen: false, data: null as any });

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

  // Handle Tab Change
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    handlePageChange(1);
    setSelectedIds([]);
  };

  // --- FILTER & PAGINATION ---
  const filteredSports = useMemo(() => {
    return initialSports.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.slug.includes(searchQuery.toLowerCase()));
  }, [initialSports, searchQuery]);

  const filteredCountries = useMemo(() => {
    return initialCountries.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialCountries, searchQuery]);

  // Reset selectedIds when filters change
  useMemo(() => { setSelectedIds([]); }, [searchQuery, leagueSportFilter, leagueCountryFilter, activeTab]);

  const countriesWithLeagues = useMemo(() => {
    const countryIds = new Set(initialLeagues.map(l => l.countryId).filter(Boolean));
    return initialCountries.filter(c => countryIds.has(c.id));
  }, [initialCountries, initialLeagues]);

  const filteredLeagues = useMemo(() => {
    return initialLeagues.filter(l => {
      const matchSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.slug.includes(searchQuery.toLowerCase());
      const matchSport = leagueSportFilter ? l.sportId === leagueSportFilter : true;
      const matchCountry = leagueCountryFilter ? (l.countryId === leagueCountryFilter || (leagueCountryFilter === "INT" && !l.countryId)) : true;
      return matchSearch && matchSport && matchCountry;
    });
  }, [initialLeagues, searchQuery, leagueSportFilter, leagueCountryFilter]);

  const getPaginatedData = (data: any[]) => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  };

  const currentDataLength = activeTab === "SPORTS" ? filteredSports.length : activeTab === "COUNTRIES" ? filteredCountries.length : filteredLeagues.length;
  const totalPages = Math.ceil(currentDataLength / PAGE_SIZE);

  // --- SUBMITS ---
  const handleSaveSport = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      icon: formData.get("icon") as string,
    };
    try {
      if (sportModal.data?.id) await updateSport(sportModal.data.id, data);
      else await createSport(data);
      toast.success("Lưu Môn thể thao thành công!");
      setSportModal({ isOpen: false, data: null });
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
    setIsSubmitting(false);
  };

  const handleSaveCountry = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      code: formData.get("code") as string,
      flag: formData.get("flag") as string,
    };
    try {
      if (countryModal.data?.id) await updateCountry(countryModal.data.id, data);
      else await createCountry(data);
      toast.success("Lưu Quốc gia thành công!");
      setCountryModal({ isOpen: false, data: null });
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
    setIsSubmitting(false);
  };

  const handleSaveLeague = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      logo: formData.get("logo") as string,
      description: formData.get("description") as string,
      sportId: formData.get("sportId") as string,
      countryId: formData.get("countryId") as string || undefined,
    };
    try {
      if (leagueModal.data?.id) await updateLeague(leagueModal.data.id, data);
      else await createLeague(data);
      toast.success("Lưu Giải đấu thành công!");
      setLeagueModal({ isOpen: false, data: null });
    } catch (err) {
      toast.error("Có lỗi xảy ra");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (type: Tab, id: string) => {
    const ok = await confirm("Bạn có chắc chắn muốn xóa? Thao tác này không thể hoàn tác.");
    if (!ok) return;
    try {
      if (type === "SPORTS") await deleteSport(id);
      if (type === "COUNTRIES") await deleteCountry(id);
      if (type === "LEAGUES") await deleteLeague(id);
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      toast.success("Đã xóa thành công");
    } catch (err) {
      toast.error("Không thể xóa. Dữ liệu này đang được liên kết với đối tượng khác.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const ok = await confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} mục đã chọn?`);
    if (!ok) return;
    
    setIsSubmitting(true);
    let successCount = 0;
    
    for (const id of selectedIds) {
      try {
        if (activeTab === "SPORTS") await deleteSport(id);
        if (activeTab === "COUNTRIES") await deleteCountry(id);
        if (activeTab === "LEAGUES") await deleteLeague(id);
        successCount++;
      } catch (err) {
        console.error("Delete failed for", id);
      }
    }
    
    if (successCount === selectedIds.length) {
      toast.success(`Đã xóa thành công ${successCount} mục`);
    } else {
      toast.error(`Đã xóa ${successCount}/${selectedIds.length} mục. Một số mục đang được liên kết.`);
    }
    
    setSelectedIds([]);
    setIsSubmitting(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentData = activeTab === "SPORTS" ? filteredSports : activeTab === "COUNTRIES" ? filteredCountries : filteredLeagues;
      const paginatedIds = getPaginatedData(currentData).map(item => item.id);
      setSelectedIds(paginatedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const currentDataList = activeTab === "SPORTS" ? filteredSports : activeTab === "COUNTRIES" ? filteredCountries : filteredLeagues;
  const currentPaginatedData = getPaginatedData(currentDataList);
  const isAllSelected = currentPaginatedData.length > 0 && currentPaginatedData.every(item => selectedIds.includes(item.id));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[600px]">
      {/* TABS */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 px-2 pt-2 gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide shrink-0">
        <button
          onClick={() => handleTabChange("SPORTS")}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm rounded-t-xl transition-all ${activeTab === "SPORTS" ? "bg-white text-emerald-600 border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] translate-y-px" : "text-slate-500 hover:text-emerald-600 hover:bg-slate-100/50 border border-transparent"}`}
        >
          <Medal className="w-4 h-4" /> Môn Thể Thao
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">{initialSports.length}</span>
        </button>
        <button
          onClick={() => handleTabChange("COUNTRIES")}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm rounded-t-xl transition-all ${activeTab === "COUNTRIES" ? "bg-white text-emerald-600 border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] translate-y-px" : "text-slate-500 hover:text-emerald-600 hover:bg-slate-100/50 border border-transparent"}`}
        >
          <Globe className="w-4 h-4" /> Quốc Gia
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">{initialCountries.length}</span>
        </button>
        <button
          onClick={() => handleTabChange("LEAGUES")}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm rounded-t-xl transition-all ${activeTab === "LEAGUES" ? "bg-white text-emerald-600 border-t border-x border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] translate-y-px" : "text-slate-500 hover:text-emerald-600 hover:bg-slate-100/50 border border-transparent"}`}
        >
          <Trophy className="w-4 h-4" /> Giải Đấu
          <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">{initialLeagues.length}</span>
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); handlePageChange(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          
          {activeTab === "LEAGUES" && (
            <div className="flex items-center gap-2">
              <div className="w-[180px]">
                <CustomSelect 
                  options={initialSports.map(s => ({value: s.id, label: s.name}))}
                  value={leagueSportFilter}
                  onChange={(val) => { setLeagueSportFilter(val); handlePageChange(1); }}
                  placeholder="Tất cả Môn"
                />
              </div>
              <div className="w-[200px]">
                <CustomSelect 
                  options={[{value: 'INT', label: '🌐 Giải Quốc Tế'}, ...countriesWithLeagues.map(c => ({value: c.id, label: c.name}))]}
                  value={leagueCountryFilter}
                  onChange={(val) => { setLeagueCountryFilter(val); handlePageChange(1); }}
                  placeholder="Tất cả Quốc gia"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Xóa ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => {
              if (activeTab === "SPORTS") setSportModal({ isOpen: true, data: null });
              if (activeTab === "COUNTRIES") setCountryModal({ isOpen: true, data: null });
              if (activeTab === "LEAGUES") setLeagueModal({ isOpen: true, data: null });
            }} 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> 
            {activeTab === "SPORTS" ? "Thêm Môn" : activeTab === "COUNTRIES" ? "Thêm Quốc Gia" : "Thêm Giải Đấu"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
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
              {activeTab === "SPORTS" && (
                <>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Icon</th>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Tên môn</th>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Slug</th>
                </>
              )}
              {activeTab === "COUNTRIES" && (
                <>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider w-16">Cờ</th>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Quốc gia</th>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Mã ISO</th>
                </>
              )}
              {activeTab === "LEAGUES" && (
                <>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Giải Đấu</th>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Môn Thể Thao</th>
                  <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider">Quốc Gia</th>
                </>
              )}
              <th className="py-3 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === "SPORTS" && currentPaginatedData.map(s => (
              <tr key={s.id} className={`hover:bg-emerald-50/30 transition-colors ${selectedIds.includes(s.id) ? 'bg-emerald-50/50' : ''}`}>
                <td className="py-3 px-5">
                  <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer" />
                </td>
                <td className="py-3 px-5 text-xl">{s.icon || "⚽"}</td>
                <td className="py-3 px-5 font-bold text-slate-800">{s.name}</td>
                <td className="py-3 px-5 text-sm text-slate-500">{s.slug}</td>
                <td className="py-3 px-5 text-right">
                  <button onClick={() => setSportModal({ isOpen: true, data: s })} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors mr-1" title="Sửa"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete("SPORTS", s.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors" title="Xóa"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}

            {activeTab === "COUNTRIES" && currentPaginatedData.map(c => (
              <tr key={c.id} className={`hover:bg-emerald-50/30 transition-colors ${selectedIds.includes(c.id) ? 'bg-emerald-50/50' : ''}`}>
                <td className="py-3 px-5">
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer" />
                </td>
                <td className="py-3 px-5">
                  {c.flag ? (
                    <img src={c.flag} alt={c.name} className="w-8 h-6 object-cover rounded shadow-sm border border-slate-200" />
                  ) : (
                    <div className="w-8 h-6 bg-slate-100 rounded border border-slate-200"></div>
                  )}
                </td>
                <td className="py-3 px-5 font-bold text-slate-800">{c.name}</td>
                <td className="py-3 px-5 text-sm text-slate-500 font-mono">{c.code}</td>
                <td className="py-3 px-5 text-right">
                  <button onClick={() => setCountryModal({ isOpen: true, data: c })} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors mr-1"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete("COUNTRIES", c.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}

            {activeTab === "LEAGUES" && currentPaginatedData.map(l => (
              <tr key={l.id} className={`hover:bg-emerald-50/30 transition-colors ${selectedIds.includes(l.id) ? 'bg-emerald-50/50' : ''}`}>
                <td className="py-3 px-5">
                  <input type="checkbox" checked={selectedIds.includes(l.id)} onChange={() => toggleSelect(l.id)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer" />
                </td>
                <td className="py-3 px-5 flex items-center gap-3">
                  {l.logo ? (
                    <img src={l.logo} alt={l.name} className="w-8 h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{l.name.charAt(0)}</div>
                  )}
                  <div>
                    <div className="font-bold text-slate-800">{l.name}</div>
                    <div className="text-[11px] text-slate-400">{l.slug}</div>
                    {l.description && <div className="text-[11px] text-slate-500 mt-0.5">{l.description}</div>}
                  </div>
                </td>
                <td className="py-3 px-5">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{l.sport?.name}</span>
                </td>
                <td className="py-3 px-5">
                  {l.country ? (
                    <div className="flex items-center gap-2">
                      {l.country.flag && <img src={l.country.flag} className="w-5 h-3.5 object-cover rounded-sm border border-slate-200" />}
                      <span className="text-sm font-semibold text-slate-700">{l.country.name}</span>
                    </div>
                  ) : (
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[11px] font-bold border border-blue-100">🌐 Quốc Tế</span>
                  )}
                </td>
                <td className="py-3 px-5 text-right align-middle">
                  <button onClick={() => setLeagueModal({ isOpen: true, data: l })} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors mr-1"><Edit2 className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete("LEAGUES", l.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}

            {currentDataLength === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Database className="w-12 h-12 text-slate-200 mb-3" />
                    <p>Không tìm thấy dữ liệu phù hợp.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={currentDataLength}
        onPageChange={handlePageChange}
        hasSelectedItems={selectedIds.length > 0}
      />

      {/* MODALS */}
      {/* Sport Modal */}
      {sportModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6 text-slate-800">{sportModal.data ? "Sửa" : "Thêm"} Môn Thể Thao</h3>
            <form onSubmit={handleSaveSport} className="space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên môn <span className="text-red-500">*</span></label><input name="name" defaultValue={sportModal.data?.name} required className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug <span className="text-red-500">*</span></label><input name="slug" defaultValue={sportModal.data?.slug} required className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Icon (Emoji)</label><input name="icon" defaultValue={sportModal.data?.icon} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setSportModal({isOpen: false, data: null})} className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center">{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Country Modal */}
      {countryModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6 text-slate-800">{countryModal.data ? "Sửa" : "Thêm"} Quốc gia</h3>
            <form onSubmit={handleSaveCountry} className="space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên quốc gia <span className="text-red-500">*</span></label><input name="name" defaultValue={countryModal.data?.name} required className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug <span className="text-red-500">*</span></label><input name="slug" defaultValue={countryModal.data?.slug} required className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="block text-sm font-semibold text-slate-700 mb-1.5">Link Cờ (URL)</label><input name="flag" defaultValue={countryModal.data?.flag} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
                <div className="col-span-2"><label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã ISO (VD: VN)</label><input name="code" defaultValue={countryModal.data?.code} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setCountryModal({isOpen: false, data: null})} className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* League Modal */}
      {leagueModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6 text-slate-800">{leagueModal.data ? "Sửa" : "Thêm"} Giải đấu</h3>
            <form onSubmit={handleSaveLeague} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên giải <span className="text-red-500">*</span></label><input name="name" defaultValue={leagueModal.data?.name} required className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug <span className="text-red-500">*</span></label><input name="slug" defaultValue={leagueModal.data?.slug} required className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"/></div>
              </div>
              
              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Chú thích</label><input name="description" defaultValue={leagueModal.data?.description} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Mô tả ngắn..."/></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Môn thể thao <span className="text-red-500">*</span></label>
                  <CustomSelect 
                    name="sportId" 
                    defaultValue={leagueModal.data?.sportId} 
                    options={initialSports.map(s => ({value: s.id, label: s.name}))}
                    placeholder="-- Chọn môn --"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quốc gia</label>
                  <CustomSelect 
                    name="countryId" 
                    defaultValue={leagueModal.data?.countryId || ""} 
                    options={[{value: '', label: '🌐 Giải Quốc tế'}, ...initialCountries.map(c => ({value: c.id, label: c.name}))]}
                    placeholder="🌐 Giải Quốc tế"
                  />
                </div>
              </div>

              <div><label className="block text-sm font-semibold text-slate-700 mb-1.5">Link Logo (URL)</label><input name="logo" defaultValue={leagueModal.data?.logo} className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="https://..."/></div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setLeagueModal({isOpen: false, data: null})} className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
