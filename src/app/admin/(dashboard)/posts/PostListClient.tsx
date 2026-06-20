"use client";

// Force client component re-bundle
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Settings, Edit, Eye, Trash2, Check, History,
  MessageCircle, ExternalLink, Link2, Server, Copy, Target, Loader2, RefreshCw
} from 'lucide-react';
import { deletePost, togglePostStatus, bulkUpdatePostStatus, bulkDeletePosts, getPaginatedPosts } from "./actions";
import { createArticleUrl } from "@/lib/helpers/url";
import { PostFilters } from "./PostFilters";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { Pagination } from "@/components/ui/Pagination";

type PostListClientProps = {
  initialPosts: any[];
  totalCount: number;
  currentPage: number;
  counts: Record<string, number>;
  currentStatus: string;
};

export default function PostListClient({ initialPosts, totalCount, currentPage: initialCurrentPage, counts, currentStatus }: PostListClientProps) {
  const confirm = useConfirm();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Client-side pagination state
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [total, setTotal] = useState<number>(totalCount);
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage);
  const [status, setStatus] = useState<string>(currentStatus);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  
  const itemsPerPage = 25;
  const totalPages = Math.ceil(total / itemsPerPage) || 1;
  const currentPosts = posts;

  const syncParamsToUrl = (newPage: number, newStatus: string) => {
    if (typeof window !== 'undefined') {
      const current = new URLSearchParams(window.location.search);
      current.set("page", newPage.toString());
      if (newStatus && newStatus !== "ALL") {
        current.set("status", newStatus);
      } else {
        current.delete("status");
      }
      const newUrl = `${window.location.pathname}?${current.toString()}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  const changeTab = async (tab: string) => {
    setStatus(tab);
    setIsLoadingPage(true);
    try {
      const searchVal = searchParams.get("search") || "";
      const res = await getPaginatedPosts(1, tab, searchVal);
      if (res.success && res.posts) {
        setPosts(res.posts);
        setTotal(res.totalCount);
        setCurrentPage(1);
        setSelectedIds([]);
        syncParamsToUrl(1, tab);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPage(false);
    }
  };

  const changePage = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isLoadingPage) return;
    setIsLoadingPage(true);
    try {
      const searchVal = searchParams.get("search") || "";
      const res = await getPaginatedPosts(newPage, status, searchVal);
      if (res.success && res.posts) {
        setPosts(res.posts);
        setTotal(res.totalCount);
        setCurrentPage(newPage);
        setSelectedIds([]);
        syncParamsToUrl(newPage, status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === currentPosts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentPosts.map(p => p.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Bulk Actions
  const handleBulkUpdateStatus = async (status: string) => {
    const statusLabel = status === 'PUBLISHED' ? 'Xuất bản' : 'Nháp';
    const ok = await confirm(`Bạn có chắc muốn chuyển ${selectedIds.length} bài viết đã chọn sang trạng thái [${statusLabel}]?`);
    if (ok) {
      setLoadingAction(status);
      startTransition(async () => {
        await bulkUpdatePostStatus(selectedIds, status);
        setSelectedIds([]);
        setLoadingAction(null);
      });
    }
  };

  const handleBulkDelete = async () => {
    const ok = await confirm(`Bạn có chắc muốn xoá vĩnh viễn ${selectedIds.length} bài viết đã chọn? Hành động này không thể hoàn tác.`);
    if (ok) {
      setLoadingAction('DELETE');
      startTransition(async () => {
        await bulkDeletePosts(selectedIds);
        setSelectedIds([]);
        setLoadingAction(null);
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* BỘ LỌC NÂNG CAO */}
      <PostFilters />

      {/* TABS TRẠNG THÁI & REFRESH */}
      <div className="px-6 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="overflow-x-auto hide-scrollbar flex-1">
          <div className="flex items-center gap-6 min-w-max">
            {[
              { id: "ALL", label: `Tất cả (${counts.ALL})` },
              { id: "DRAFT", label: `Nháp (${counts.DRAFT})` },
              { id: "PENDING", label: `Chờ duyệt (${counts.PENDING})` },
              { id: "PUBLISHED", label: `Đã xuất bản (${counts.PUBLISHED})` },
              { id: "ARCHIVED", label: `Đã hạ (${counts.ARCHIVED})` },
              { id: "REJECTED", label: `Trả lại (${counts.REJECTED})` },
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => changeTab(tab.id)}
                className={`py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors relative ${currentStatus === tab.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Nút Làm mới */}
        <div className="pl-3 sm:pl-4 border-l border-slate-100 flex-shrink-0 ml-3 sm:ml-4">
          <button 
            onClick={() => startTransition(() => router.refresh())}
            disabled={isPending}
            className="flex items-center gap-2 px-2 py-1.5 sm:px-3 text-[13px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white rounded-full py-2 px-4 sm:py-2.5 sm:px-5 shadow-2xl flex items-center gap-3 sm:gap-4 border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-[95vw] md:max-w-max">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-3 sm:pr-4 shrink-0">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[12px] sm:text-xs font-bold text-slate-300 whitespace-nowrap">
              Đã chọn <span className="text-emerald-400 font-extrabold">{selectedIds.length}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleBulkUpdateStatus("PUBLISHED")}
              disabled={isPending}
              title="Xuất bản đồng loạt"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {loadingAction === 'PUBLISHED' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{loadingAction === 'PUBLISHED' ? 'Đang XB...' : 'Xuất bản'}</span>
            </button>
            
            <button
              onClick={() => handleBulkUpdateStatus("DRAFT")}
              disabled={isPending}
              title="Chuyển về Nháp đồng loạt"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-700/50 cursor-pointer"
            >
              {loadingAction === 'DRAFT' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{loadingAction === 'DRAFT' ? 'Đang lưu...' : 'Nháp'}</span>
            </button>
            
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              title="Xoá đồng loạt"
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {loadingAction === 'DELETE' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{loadingAction === 'DELETE' ? 'Đang xoá...' : 'Xoá'}</span>
            </button>
            
            <button
              onClick={() => setSelectedIds([])}
              disabled={isPending}
              className="text-xs text-slate-400 hover:text-white font-bold px-2 sm:px-2.5 py-1.5 rounded-full hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <div className="overflow-x-auto relative min-h-[400px]">
        {/* Lớp phủ Loading đè lên toàn bộ bảng */}
        {(isPending || isLoadingPage) && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1.5px] z-20 flex items-center justify-center transition-all duration-300">
             <div className="flex flex-col items-center gap-3 bg-white/90 p-5 rounded-2xl shadow-xl border border-emerald-100">
               <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
               <span className="text-sm font-bold text-emerald-800">Đang tải dữ liệu...</span>
             </div>
          </div>
        )}
        
        <table className="w-full text-left border-collapse min-w-0 md:min-w-[1100px] block md:table">
          <thead className="hidden md:table-header-group">
            <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-3 md:px-4 py-4 w-10 text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 mx-auto rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-75 ${
                    currentPosts.length > 0 && selectedIds.length === currentPosts.length
                      ? 'bg-emerald-600 border-emerald-600 text-white' 
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                  aria-label="Select all posts"
                >
                  {currentPosts.length > 0 && selectedIds.length === currentPosts.length && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </button>
              </th>
              <th className="px-2 py-4 w-10 text-center hidden md:table-cell">STT</th>
              <th className="px-3 md:px-4 py-4">BÀI VIẾT</th>
              <th className="px-4 py-4 text-center w-24 hidden lg:table-cell">NGUỒN</th>
              <th className="px-4 py-4 text-center w-28 hidden md:table-cell">TRẠNG THÁI</th>
              <th className="px-4 py-4 text-center w-24 hidden sm:table-cell">LƯỢT XEM</th>
              <th className="px-4 py-4 text-center w-20 hidden lg:table-cell">SỐ TỪ</th>
              <th className="px-4 py-4 text-center w-24 hidden md:table-cell">ĐIỂM SEO</th>
              <th className="px-4 py-4 text-center w-28 hidden md:table-cell">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 block md:table-row-group">
            {currentPosts.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-500 font-medium">
                  Không tìm thấy bài viết nào.
                </td>
              </tr>
            ) : (
              currentPosts.map((post, index) => {
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case 'PUBLISHED': return { label: 'Xuất bản', cls: 'bg-emerald-100 text-emerald-700' };
                    case 'PENDING_EDITOR': return { label: 'Chờ biên tập', cls: 'bg-amber-100 text-amber-700' };
                    case 'PENDING_PUBLISH': return { label: 'Chờ xuất bản', cls: 'bg-amber-100 text-amber-700' };
                    case 'PENDING_TKTS': return { label: 'Chờ XB TKTS', cls: 'bg-orange-100 text-orange-700' };
                    case 'ARCHIVED': return { label: 'Hạ xuất bản', cls: 'bg-slate-100 text-slate-500' };
                    case 'TEMPLATE': return { label: 'Mẫu nội dung', cls: 'bg-purple-100 text-purple-700' };
                    case 'SCHEDULED': return { label: 'Hẹn giờ XB', cls: 'bg-blue-100 text-blue-700' };
                    case 'REJECTED': return { label: 'Trả lại', cls: 'bg-red-100 text-red-600' };
                    case 'DRAFT':
                    default: return { label: 'Nháp', cls: 'bg-slate-100 text-slate-600' };
                  }
                };
                const statusConfig = getStatusConfig(post.status);
                const isPublished = post.status === "PUBLISHED";
                const formattedDate = new Date(post.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
                
                let parsedMetadata: any = {};
                try {
                  if (post.metadata) parsedMetadata = JSON.parse(post.metadata);
                } catch (e) {}

                const seoScore = post.seoScore || 0;
                const source = parsedMetadata?.source || 'Hệ thống';
                const mainCategory = post.categories && post.categories.length > 0 ? post.categories[0].name : 'Chưa phân loại';
                const wordCount = post.wordCount || 0;

                const isSelected = selectedIds.includes(post.id);
                
                return (
                  <tr 
                    key={post.id} 
                    className={`transition-colors border-b border-slate-100 last:border-0 relative flex items-start md:table-row p-4 md:p-0 ${
                      isSelected 
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/50 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-emerald-500' 
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="hidden max-md:!hidden md:table-cell p-0 md:px-3 md:py-5 md:align-middle md:w-12">
                      <button
                        type="button"
                        onClick={() => toggleSelect(post.id)}
                        className={`w-5 h-5 mx-auto rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-75 ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 bg-white hover:border-slate-400'
                        }`}
                        aria-label="Toggle select post"
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </button>
                    </td>
                    <td className="px-2 py-5 text-center align-middle text-[13px] text-slate-500 font-medium hidden max-md:!hidden md:table-cell">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="flex-1 min-w-0 md:table-cell p-0 md:px-4 md:py-5 md:align-top">
                      {/* Mobile View */}
                      <div className="flex flex-col gap-3 md:hidden">
                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="w-[85px] h-[60px] shrink-0 relative rounded-lg overflow-hidden bg-[#f1f5f9] border border-slate-200 shadow-sm">
                            {post.imageUrl ? (
                              <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[9px] font-bold uppercase">No Image</div>
                            )}
                            
                            {/* Floating select button for mobile */}
                            <button
                              type="button"
                              onClick={() => toggleSelect(post.id)}
                              className={`absolute top-1 left-1 w-5 h-5 rounded-full border transition-all flex items-center justify-center cursor-pointer active:scale-75 z-10 shadow-sm ${
                                isSelected 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'border-white/80 bg-white/70 backdrop-blur-sm hover:bg-white'
                              }`}
                              aria-label="Toggle select post"
                            >
                              {isSelected ? (
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              )}
                            </button>
                          </div>
                          {/* Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap ${statusConfig.cls}`}>{statusConfig.label}</span>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {post.id}</span>
                              </div>
                              <h3 className="font-bold text-slate-800 text-[13px] leading-snug hover:text-emerald-600 transition-colors line-clamp-2">
                                <Link href={createArticleUrl(post.title, post.id)} target="_blank" className="hover:underline">{post.title}</Link>
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Metadata Pills */}
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500">
                          <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">Mục: {mainCategory}</span>
                          <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">Nguồn: {source}</span>
                          <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">Từ: {wordCount}</span>
                          <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                            SEO: <span className={seoScore >= 80 ? 'text-emerald-600 font-black' : seoScore >= 50 ? 'text-amber-600 font-black' : 'text-red-500 font-black'}>{seoScore}</span>
                          </span>
                        </div>

                        {/* Actions bar at bottom */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/60 mt-1">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/posts/${post.id}/edit`} prefetch={false} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-emerald-600 transition-colors flex items-center justify-center" title="Sửa">
                              <Edit className="w-3.5 h-3.5" />
                            </Link>
                            <button 
                              type="button" 
                              onClick={async () => {
                                const ok = await confirm("Bạn có chắc muốn xoá?");
                                if (ok) {
                                  await deletePost(post.id);
                                }
                              }} 
                              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-red-600 transition-colors flex items-center justify-center"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-slate-400 hover:text-emerald-600 transition-colors" title="Target"><Target className="w-3.5 h-3.5" /></button>
                            <button className="p-1 text-slate-400 hover:text-emerald-600 transition-colors" title="Copy Link"><Copy className="w-3.5 h-3.5" /></button>
                            
                            <button 
                              type="button"
                              disabled={isPending}
                              onClick={() => {
                                startTransition(async () => {
                                    await togglePostStatus(post.id, post.status);
                                });
                              }}
                              className={`ml-2 w-8 h-4 rounded-full relative cursor-pointer shadow-inner flex items-center px-0.5 transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''} ${isPublished ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                              title={isPublished ? 'Chuyển về Nháp' : 'Xuất bản ngay'}
                            >
                               <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  {isPublished && <Check className="w-2.5 h-2.5 text-emerald-500" strokeWidth={3} />}
                               </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="hidden md:flex gap-4">
                        <div className="w-[120px] h-[80px] shrink-0 relative rounded overflow-hidden bg-[#f1f5f9] border border-slate-200">
                          {post.imageUrl ? (
                            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#94a3b8] text-[9px] font-bold uppercase tracking-wider">No Image</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-slate-800 text-[14px] leading-snug mb-1.5 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                              <Link href={createArticleUrl(post.title, post.id)} target="_blank" className="hover:underline">{post.title}</Link>
                              <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Target"><Target className="w-3.5 h-3.5" /></button>
                              <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
                            </h3>
                            <div className="text-[12px] text-slate-500 space-y-0.5">
                              <p><span className="font-medium text-slate-600">{post.id}</span> - {post.type === 'VIDEO' ? 'Video' : post.type === 'EMAGAZINE' ? 'eMagazine' : 'Bài thường'}</p>
                              <p>Tác giả: <span className="text-slate-800 font-medium">{post.author}</span></p>
                              <p>Ngày tạo: {formattedDate} - Cập nhật gần nhất: {formattedDate}</p>
                              <div className="flex items-center mt-1.5 gap-2">
                                <span>Mục chính: <span className="text-slate-800 font-medium">{mainCategory}</span></span>
                                <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Lịch sử"><History className="w-3.5 h-3.5" /></button>
                                <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Xem trước"><Eye className="w-3.5 h-3.5" /></button>
                                <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Bình luận"><MessageCircle className="w-3.5 h-3.5" /></button>
                                <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Mở trang"><ExternalLink className="w-3.5 h-3.5" /></button>
                                <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Copy link"><Link2 className="w-3.5 h-3.5" /></button>
                                <button className="text-slate-400 hover:text-emerald-600 transition-colors" title="Server/Layout"><Server className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center align-middle hidden lg:table-cell">
                      <span className="text-[13px] text-slate-600">{source}</span>
                    </td>
                    <td className="px-4 py-5 text-center align-middle hidden md:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${statusConfig.cls}`}>{statusConfig.label}</span>
                    </td>
                    <td className="px-4 py-5 text-center align-middle hidden sm:table-cell">
                      <div className="text-[13px] text-slate-600">0</div>
                    </td>
                    <td className="px-4 py-5 align-middle text-center text-slate-500 font-medium text-[13px] hidden lg:table-cell">
                      {wordCount}
                    </td>
                    <td className="px-4 py-5 align-middle text-center hidden md:table-cell">
                      <span className="text-[12px] font-bold">
                        <span className={seoScore >= 80 ? 'text-emerald-500' : seoScore >= 50 ? 'text-amber-500' : 'text-red-500'}>{seoScore}</span> 
                        <span className="text-slate-400"> / 100</span>
                      </span>
                    </td>
                    <td className="px-4 py-5 align-middle hidden md:table-cell">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2.5">
                          <Link href={`/admin/posts/${post.id}/edit`} prefetch={false} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Chỉnh sửa"><Edit className="w-4 h-4" /></Link>
                          <Link href={createArticleUrl(post.title, post.id)} target="_blank" className="text-slate-400 hover:text-emerald-600 transition-colors" title="Xem trước"><Eye className="w-4 h-4" /></Link>
                          <form action={async () => {
                              const ok = await confirm("Bạn có chắc muốn xoá?");
                              if (ok) {
                                await deletePost(post.id);
                              }
                            }} className="inline-block">
                              <button type="button" onClick={async () => {
                                const ok = await confirm("Bạn có chắc muốn xoá?");
                                if (ok) {
                                  await deletePost(post.id);
                                }
                              }} className="text-slate-400 hover:text-red-600 transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                          </form>
                        </div>
                        
                        <div className="flex justify-center w-full mt-2">
                          <button 
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              startTransition(async () => {
                                  await togglePostStatus(post.id, post.status);
                              });
                            }}
                            className={`w-8 h-4 rounded-full relative cursor-pointer shadow-inner flex items-center px-0.5 transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''} ${isPublished ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                            title={isPublished ? 'Chuyển về Nháp' : 'Xuất bản ngay'}
                          >
                             <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                                {isPublished && <Check className="w-2.5 h-2.5 text-emerald-500" strokeWidth={3} />}
                             </div>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={total}
        onPageChange={changePage}
        isPending={isLoadingPage}
        hasSelectedItems={selectedIds.length > 0}
      />
    </div>
  );
}
