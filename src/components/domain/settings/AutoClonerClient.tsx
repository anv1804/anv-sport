'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Play, RefreshCw, CheckCircle, AlertTriangle, ToggleLeft, ToggleRight, Loader2, Globe, Calendar, Link2, PlusCircle, Check, X, History, Ban, ChevronLeft, ChevronRight, ExternalLink, ChevronUp, ChevronDown, Pencil } from 'lucide-react'
import { createClonerSource, updateClonerSource, deleteClonerSource, triggerManualCrawl, prepareCrawlForSource, crawlArticleLink, updateSourceLastRun, getClonerState, addClonerJob, stopActiveClonerJob, getClonerHistory, getSchedulerSettings, updateSchedulerSettings } from '@/app/admin/(dashboard)/auto-cloner/actions'
import { CategorySearchSelect, CategoryOption } from '@/components/ui/CategorySearchSelect'
import { useConfirm } from '@/components/providers/ConfirmProvider'

interface AutoClonerSource {
  id: string
  url: string
  categoryId: string
  categorySlug: string
  isActive: boolean
  daysLimit: number
  isForeign: boolean
  lastRunAt: Date | null
  createdAt: Date
  category: {
    name: string
    slug: string
  }
}

interface AutoClonerClientProps {
  sources: AutoClonerSource[]
  categories: { id: string; name: string; slug: string; parentId: string | null }[]
}

// Helpers
function getFlattenedCategories(categories: { id: string; name: string; slug: string; parentId: string | null }[]) {
  const map = new Map<string, any>();
  categories.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots: any[] = [];
  categories.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)?.children.push(map.get(c.id));
    } else {
      roots.push(map.get(c.id));
    }
  });

  const flat: CategoryOption[] = [];
  const traverse = (nodes: any[], depth: number) => {
    nodes.forEach(node => {
      flat.push({ id: node.id, name: node.name, depth });
      traverse(node.children, depth + 1);
    });
  };
  traverse(roots, 0);
  return flat;
}

function formatUrlDisplay(url: string) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const pathname = urlObj.pathname;
    const shortPath = pathname.length > 25 ? pathname.substring(0, 22) + '...' : pathname;
    return `${domain}${shortPath}`;
  } catch (e) {
    return url;
  }
}

interface CustomToast {
  id: string
  message: string
  type: 'success' | 'error' | 'loading'
}

export function AutoClonerClient({ sources, categories }: AutoClonerClientProps) {
  const router = useRouter()
  const confirm = useConfirm()
  
  const flattenedCategories = useMemo(() => getFlattenedCategories(categories), [categories])
  
  // Custom Toast State
  const [toasts, setToasts] = useState<CustomToast[]>([])

  const addToast = (message: string, type: 'success' | 'error' | 'loading') => {
    const id = Math.random().toString()
    setToasts(prev => [...prev, { id, message, type }])
    if (type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 5000)
    }
    return id
  }

  const updateToastToSuccess = (id: string, message: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, type: 'success', message } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const updateToastToError = (id: string, message: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, type: 'error', message } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // States
  const [isCrawling, setIsCrawling] = useState(false)
  const isCrawlingRef = useRef(false)
  isCrawlingRef.current = isCrawling
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newDaysLimit, setNewDaysLimit] = useState(7)
  const [newIsForeign, setNewIsForeign] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // Multi-select & Progress States
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [queue, setQueue] = useState<any[]>([])
  const [showProgressBanner, setShowProgressBanner] = useState(false)
  const [isProgressCollapsed, setIsProgressCollapsed] = useState(false)
  
  const [crawlProgress, setCrawlProgress] = useState({
    active: false,
    status: 'idle' as 'idle' | 'running' | 'completed' | 'stopped',
    currentSourceIndex: 0,
    totalSources: 0,
    currentSourceName: '',
    totalExtracted: 0,
    validCount: 0,
    processedArticles: 0,
    totalArticlesToCrawl: 0,
    successCount: 0,
    failedCount: 0,
    currentArticleUrl: '',
    percentage: 0
  })

  // Scheduler Settings States
  const [targetHours, setTargetHours] = useState<number[]>(Array.from({ length: 24 }, (_, i) => i))
  const [checkIntervalMinutes, setCheckIntervalMinutes] = useState(5)
  const [showSettingsForm, setShowSettingsForm] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Fetch scheduler settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await getSchedulerSettings()
        if (res.success && res.settings) {
          setTargetHours(res.settings.targetHours || [])
          setCheckIntervalMinutes(res.settings.checkIntervalMinutes || 5)
        }
      } catch (err) {
        console.error("Lỗi khi tải cấu hình scheduler:", err)
      }
    }
    loadSettings()
  }, [])

  // Load banner state from localStorage on mount
  useEffect(() => {
    const savedShow = localStorage.getItem('auto_cloner_show_banner')
    if (savedShow !== null) {
      setShowProgressBanner(savedShow === 'true')
    }
    const savedCollapsed = localStorage.getItem('auto_cloner_banner_collapsed')
    if (savedCollapsed !== null) {
      setIsProgressCollapsed(savedCollapsed === 'true')
    }
    const savedProgress = localStorage.getItem('auto_cloner_progress')
    if (savedProgress) {
      try {
        setCrawlProgress(JSON.parse(savedProgress))
      } catch (e) {
        console.error("Lỗi parse progress từ localStorage:", e)
      }
    }
  }, [])

  // Persist banner state changes to localStorage
  useEffect(() => {
    localStorage.setItem('auto_cloner_show_banner', String(showProgressBanner))
  }, [showProgressBanner])

  useEffect(() => {
    localStorage.setItem('auto_cloner_banner_collapsed', String(isProgressCollapsed))
  }, [isProgressCollapsed])

  useEffect(() => {
    localStorage.setItem('auto_cloner_progress', JSON.stringify(crawlProgress))
  }, [crawlProgress])

  // Confirmation and History States
  const [showConfirmStop, setShowConfirmStop] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyData, setHistoryData] = useState<any>({ posts: [], total: 0, totalPages: 1, currentPage: 1 })
  const [historyFilters, setHistoryFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    categoryId: '',
    startDate: '',
    endDate: ''
  })
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Edit Source States
  const [editingSource, setEditingSource] = useState<AutoClonerSource | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDaysLimit, setEditDaysLimit] = useState(7)
  const [editIsForeign, setEditIsForeign] = useState(false)
  const [isUpdatingSource, setIsUpdatingSource] = useState(false)

  const handleEditClick = (source: AutoClonerSource) => {
    setEditingSource(source)
    setEditUrl(source.url)
    setEditCategoryId(source.categoryId)
    setEditDaysLimit(source.daysLimit)
    setEditIsForeign(source.isForeign)
  }

  const handleUpdateSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSource || !editUrl || !editCategoryId) {
      addToast('Vui lòng điền đầy đủ đường dẫn và chọn danh mục', 'error')
      return
    }

    setIsUpdatingSource(true)
    try {
      const result = await updateClonerSource(editingSource.id, {
        url: editUrl,
        categoryId: editCategoryId,
        daysLimit: Number(editDaysLimit),
        isForeign: editIsForeign
      })

      if (result.success) {
        addToast('Cập nhật cấu hình nguồn quét thành công!', 'success')
        setEditingSource(null)
        router.refresh()
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi cập nhật cloner source', 'error')
    } finally {
      setIsUpdatingSource(false)
    }
  }

  const loadHistory = async (filtersObj = historyFilters) => {
    setLoadingHistory(true)
    try {
      const res = await getClonerHistory(filtersObj)
      if (res.success) {
        setHistoryData(res)
      } else {
        addToast(res.error || 'Lỗi khi tải lịch sử', 'error')
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi hệ thống khi tải lịch sử', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load history when modal opens or filters change
  useEffect(() => {
    if (showHistoryModal) {
      loadHistory(historyFilters)
    }
  }, [showHistoryModal, historyFilters])

  const handleStopJob = async () => {
    try {
      const res = await stopActiveClonerJob()
      if (res.success) {
        addToast('Đã gửi yêu cầu dừng khẩn cấp tiến trình!', 'success')
        setShowConfirmStop(false)
        setIsCrawling(false)
        setCrawlProgress(prev => ({
          ...prev,
          active: false,
          status: 'stopped'
        }))
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi dừng tiến trình', 'error')
    }
  }

  // Poll background cloner state dynamically to avoid database and connection pool bloat
  useEffect(() => {
    let active = true
    let timeoutId: any = null
    
    const fetchState = async () => {
      let pollDelay = 10000 // Default to 10s when idle
      
      try {
        const state = await getClonerState()
        if (!active) return

        setQueue(state.queue || [])

        if (state.activeJob) {
          pollDelay = 2000 // Poll fast (2s) when actively running
          const isFailed = state.activeJob.status === 'failed'
          setIsCrawling(!isFailed)
          setShowProgressBanner(true)
          setCrawlProgress({
            active: !isFailed,
            status: isFailed ? 'stopped' : 'running',
            currentSourceIndex: state.activeJob.currentSourceIndex,
            totalSources: state.activeJob.totalSources,
            currentSourceName: isFailed 
              ? 'Đã dừng tiến trình khẩn cấp' 
              : (state.activeJob.currentArticleUrl.startsWith('Đang') 
                  ? state.activeJob.currentArticleUrl 
                  : `Đang cào bài viết...`),
            totalExtracted: state.activeJob.totalExtracted,
            validCount: state.activeJob.validCount,
            processedArticles: state.activeJob.processedArticles,
            totalArticlesToCrawl: state.activeJob.totalArticlesToCrawl,
            successCount: state.activeJob.successCount,
            failedCount: state.activeJob.failedCount,
            currentArticleUrl: state.activeJob.currentArticleUrl,
            percentage: state.activeJob.percentage
          })
        } else {
          // If crawl was active locally but finished on server, trigger update
          if (isCrawlingRef.current) {
            setIsCrawling(false)
            setCrawlProgress(prev => ({
              ...prev,
              active: false,
              status: 'completed',
              percentage: 100
            }))
            addToast('Tiến trình quét đã hoàn tất!', 'success')
            router.refresh()
          }
        }
      } catch (err) {
        console.error("Lỗi khi đồng bộ tiến trình:", err)
      } finally {
        if (active) {
          timeoutId = setTimeout(fetchState, pollDelay)
        }
      }
    }

    fetchState()
    
    return () => {
      active = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [router])

  const crawlSources = async (sourceIds: string[]) => {
    if (sourceIds.length === 0) {
      addToast('Vui lòng chọn ít nhất 1 nguồn để quét!', 'error')
      return
    }

    try {
      const res = await addClonerJob(sourceIds)
      if (res.success) {
        addToast(res.message || 'Đã thêm yêu cầu quét vào hàng đợi hệ thống!', 'success')
        setSelectedIds([])
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi yêu cầu quét dữ liệu', 'error')
    }
  }

  const handleManualCrawl = async () => {
    // Run for all active cloner sources
    const activeIds = sources.filter(s => s.isActive).map(s => s.id)
    if (activeIds.length === 0) {
      addToast('Không có nguồn cloner nào đang hoạt động!', 'error')
      return
    }
    await crawlSources(activeIds)
  }

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl || !newCategoryId) {
      addToast('Vui lòng điền đầy đủ đường dẫn và chọn danh mục', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createClonerSource({
        url: newUrl,
        categoryId: newCategoryId,
        daysLimit: Number(newDaysLimit),
        isForeign: newIsForeign
      })

      if (result.success) {
        addToast('Thêm nguồn cloner mới thành công!', 'success')
        setNewUrl('')
        setNewCategoryId('')
        setNewDaysLimit(7)
        setNewIsForeign(false)
        setShowAddForm(false)
        router.refresh()
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi thêm cloner source', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await updateClonerSource(id, { isActive: !currentStatus })
      if (result.success) {
        addToast(`Đã ${!currentStatus ? 'kích hoạt' : 'tạm dừng'} nguồn quét`, 'success')
        router.refresh()
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error')
    }
  }

  const handleDeleteSource = async (id: string) => {
    const ok = await confirm('Bạn có chắc chắn muốn xóa nguồn cloner này không?')
    if (!ok) return

    try {
      const result = await deleteClonerSource(id)
      if (result.success) {
        addToast('Đã xóa nguồn cloner', 'success')
        router.refresh()
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi khi xóa nguồn cloner', 'error')
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notifications Container */}
      <div className="fixed top-6 right-6 z-50 space-y-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 pointer-events-auto animate-in slide-in-from-right-5 duration-300 ${
              t.type === 'loading'
                ? 'bg-white/95 border-slate-200/80 text-slate-800'
                : t.type === 'success'
                ? 'bg-emerald-500/95 border-emerald-600/50 text-white'
                : 'bg-red-500/95 border-red-600/50 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />}
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
              {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-white" />}
              <span className="text-sm font-bold">{t.message}</span>
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="p-1 hover:bg-black/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <RefreshCw className={`w-6 h-6 text-emerald-600 ${isCrawling ? 'animate-spin' : ''}`} />
            Auto Cloner Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Đồng bộ hóa tin tức thể thao tự động từ các nguồn tin hàng đầu (VnExpress, Dantri, VietnamNet...)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <History className="w-4 h-4" />
            Lịch Sử Quét
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Hủy' : 'Thêm Nguồn Mới'}
          </button>

          <button
            onClick={() => setShowSettingsForm(!showSettingsForm)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-xl transition-all ${
              showSettingsForm ? 'text-white bg-slate-700 hover:bg-slate-800' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Cấu hình Giờ Quét
          </button>
          
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => crawlSources(selectedIds)}
              disabled={isCrawling}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 disabled:shadow-none transition-all animate-in zoom-in duration-200"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Quét nguồn đã chọn ({selectedIds.length})
                </>
              )}
            </button>
          )}

          {isCrawling ? (
            <button
              type="button"
              onClick={() => setShowConfirmStop(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-650 rounded-xl shadow-lg shadow-red-500/20 transition-all animate-pulse"
            >
              <Ban className="w-4 h-4" />
              Dừng Khẩn Cấp
            </button>
          ) : (
            <button
              onClick={handleManualCrawl}
              disabled={isCrawling}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-emerald-400 disabled:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 disabled:shadow-none transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              Quét Tất Cả Nguồn
            </button>
          )}
        </div>
      </div>

      {/* Real-time Crawling Progress Banner */}
      {showProgressBanner && (
        <div className="p-6 bg-slate-900 text-white rounded-[24px] shadow-2xl border border-slate-800 space-y-4 animate-in slide-in-from-top-5 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-lg text-emerald-400 flex items-center gap-2">
                {crawlProgress.status === 'running' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                ) : crawlProgress.status === 'stopped' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
                {crawlProgress.status === 'running' 
                  ? 'Tiến Trình Đồng Bộ Tin Tức Tự Động' 
                  : crawlProgress.status === 'stopped'
                  ? 'Tiến Trình Đã Bị Dừng Khẩn Cấp'
                  : 'Tiến Trình Đồng Bộ Đã Hoàn Tất'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {crawlProgress.status === 'running' 
                  ? crawlProgress.currentSourceName 
                  : crawlProgress.status === 'stopped'
                  ? 'Tiến trình quét đã dừng theo yêu cầu của quản trị viên. Hàng đợi đã được xóa.'
                  : 'Tất cả các tin bài từ nguồn đã chọn đã được quét, lọc trùng, viết lại bằng AI và đăng thành công!'}
              </p>
            </div>
            
            <div className="flex items-center gap-4 self-end md:self-auto">
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-3xl font-black text-white">{crawlProgress.percentage}%</span>
                <span className="text-xs text-slate-455">hoàn thành</span>
              </div>
              
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <button
                  type="button"
                  onClick={() => setIsProgressCollapsed(!isProgressCollapsed)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                  title={isProgressCollapsed ? 'Mở rộng bảng' : 'Thu gọn bảng'}
                >
                  {isProgressCollapsed ? <ChevronDown className="w-4.5 h-4.5" /> : <ChevronUp className="w-4.5 h-4.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProgressBanner(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                  title="Đóng bảng"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${crawlProgress.percentage}%` }}
            />
          </div>

          {!isProgressCollapsed && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-455 font-semibold uppercase tracking-wider">Tiến trình nguồn</div>
                  <div className="text-lg font-black text-white mt-1">
                    {crawlProgress.currentSourceIndex} <span className="text-xs text-slate-500">/ {crawlProgress.totalSources}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-455 font-semibold uppercase tracking-wider">Số bài quét được</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">
                    {crawlProgress.totalExtracted}
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-455 font-semibold uppercase tracking-wider">Bài hợp lệ (chưa cào)</div>
                  <div className="text-lg font-black text-teal-400 mt-1">
                    {crawlProgress.validCount}
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
                  <div className="text-xs text-slate-455 font-semibold uppercase tracking-wider text-emerald-500 font-bold">Lưu thành công</div>
                  <div className="text-lg font-black text-emerald-500 mt-1">
                    {crawlProgress.successCount} <span className="text-xs text-slate-500">/ {crawlProgress.totalArticlesToCrawl}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center col-span-2 md:col-span-1">
                  <div className="text-xs text-slate-455 font-semibold uppercase tracking-wider text-red-400 font-bold">Thất bại</div>
                  <div className="text-lg font-black text-red-400 mt-1">
                    {crawlProgress.failedCount}
                  </div>
                </div>
              </div>

              {crawlProgress.currentArticleUrl && crawlProgress.status === 'running' && (
                <div className="p-2.5 bg-slate-950 rounded-xl text-[11px] font-mono text-slate-400 flex items-center gap-2 truncate">
                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-bold">LINK</span>
                  <span className="truncate">{crawlProgress.currentArticleUrl}</span>
                </div>
              )}

              {queue.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Hàng đợi yêu cầu quét ({queue.length})
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                    {queue.map((q, idx) => (
                      <div key={q.id || idx} className="text-[11px] text-slate-400 flex items-center justify-between py-1.5 px-3 bg-slate-950 rounded-xl font-medium">
                        <span className="truncate max-w-[80%]">Yêu cầu quét #{idx + 1} ({q.sourceIds.length} nguồn)</span>
                        <span className="px-2 py-0.5 bg-slate-850 text-blue-400 rounded-lg text-[9px] font-extrabold uppercase tracking-wide">ĐANG CHỜ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Notice about Scheduler Slots */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 leading-relaxed font-medium">
            <span className="font-bold">Lịch quét tự động kích hoạt vào:</span> {targetHours.length === 24 ? 'Tất cả các giờ trong ngày (mỗi tiếng quét 1 lần)' : targetHours.sort((a, b) => a - b).map(h => `${h}h`).join(', ')} mỗi ngày.
            <br />
            <span className="text-[10px] text-slate-500 font-normal">Hệ thống sẽ chạy kiểm tra chu kỳ tự động mỗi {checkIntervalMinutes} phút một lần để so khớp khung giờ và thực hiện quét.</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettingsForm(!showSettingsForm)}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 border border-emerald-200 bg-white/80 hover:bg-emerald-100/50 px-3 py-1.5 rounded-lg transition-all"
        >
          {showSettingsForm ? 'Đóng cấu hình' : 'Thay đổi lịch quét'}
        </button>
      </div>

      {/* Scheduler Configuration Form */}
      {showSettingsForm && (
        <div className="p-6 bg-white border border-slate-200/60 rounded-[24px] shadow-sm space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-655" />
              Thiết lập Lịch Quét & Hẹn Giờ Tự Động
            </h3>
            <button
              onClick={() => setShowSettingsForm(false)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-455 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Clock Interval Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Chu kỳ quét kiểm tra (Số phút)
              </label>
              <p className="text-[11px] text-slate-400 font-medium">
                Xác định khoảng thời gian hệ thống thức dậy để đối chiếu khung giờ hiện tại. Giá trị càng nhỏ thì độ trễ khi chạy quét càng thấp.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={checkIntervalMinutes}
                  onChange={(e) => setCheckIntervalMinutes(Math.max(1, Number(e.target.value)))}
                  className="w-32 px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-sm font-bold text-slate-600">phút / lần</span>
              </div>
            </div>

            {/* Hour select Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Khung giờ kích hoạt quét (Giờ trong ngày)
              </label>
              <p className="text-[11px] text-slate-400 font-medium">
                Chọn các giờ hệ thống sẽ tiến hành chạy crawl bài viết mới. (Giờ hệ thống dựa trên múi giờ UTC+7).
              </p>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 pt-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const isSelected = targetHours.includes(hour);
                  return (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setTargetHours(prev => prev.filter(h => h !== hour));
                        } else {
                          setTargetHours(prev => [...prev, hour]);
                        }
                      }}
                      className={`py-2 text-center text-xs font-black rounded-lg transition-all border ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-50 border-slate-200/50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {String(hour).padStart(2, '0')}h
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetHours(Array.from({ length: 24 }, (_, i) => i))}
                  className="text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  Chọn tất cả (Mỗi tiếng 1 lần)
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setTargetHours([])}
                  className="text-[11px] font-bold text-slate-500 hover:underline"
                >
                  Bỏ chọn tất cả (Tạm dừng quét tự động)
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowSettingsForm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSavingSettings}
              onClick={async () => {
                setIsSavingSettings(true)
                try {
                  const res = await updateSchedulerSettings({
                    targetHours,
                    checkIntervalMinutes
                  })
                  if (res.success) {
                    addToast('Cập nhật cấu hình lịch quét tự động thành công!', 'success')
                    setShowSettingsForm(false)
                    router.refresh()
                  } else {
                    addToast(res.error || 'Lỗi khi cập nhật cấu hình', 'error')
                  }
                } catch (err: any) {
                  addToast(err.message || 'Lỗi hệ thống', 'error')
                } finally {
                  setIsSavingSettings(false)
                }
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 rounded-lg shadow-md transition-all flex items-center gap-1.5"
            >
              {isSavingSettings && <Loader2 className="w-3 h-3 animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}

      {/* Slide-down Form to Add Source */}
      {showAddForm && (
        <form onSubmit={handleAddSource} className="p-6 bg-white border border-slate-200/60 rounded-[24px] shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            Cấu hình Nguồn Quét Mới
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đường Dẫn Mục Quét (URL)</label>
              <div className="relative">
                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  placeholder="Ví dụ: https://vnexpress.net/the-thao/bong-da"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh Mục Đích</label>
              <CategorySearchSelect
                value={newCategoryId}
                onChange={(val) => setNewCategoryId(val)}
                options={flattenedCategories}
                placeholder="-- Chọn Danh Mục Website --"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giới hạn số ngày đăng bài</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newDaysLimit}
                  onChange={(e) => setNewDaysLimit(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Chỉ cào bài viết đăng trong vòng X ngày gần đây.</p>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isForeign"
                checked={newIsForeign}
                onChange={(e) => setNewIsForeign(e.target.checked)}
                className="w-5 h-5 border-slate-200 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isForeign" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
                <Globe className="w-4 h-4 text-slate-400" />
                Nguồn nước ngoài (Cần AI dịch & biên tập lại)</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Lưu Nguồn Mới
            </button>
          </div>
        </form>
      )}

      {/* Source List Table */}
      <div className="bg-white border border-slate-200/60 rounded-[24px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg">Danh Sách Nguồn Đang Chạy</h3>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
            {sources.length} Nguồn quét
          </span>
        </div>

        {sources.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Chưa có nguồn cloner nào được cấu hình.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-sm font-bold text-emerald-600 hover:underline"
            >
              Thêm nguồn đầu tiên ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-0">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/60 text-xs font-bold text-slate-444 uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6 w-[55px] text-center">
                    <input
                      type="checkbox"
                      className="w-4.5 h-4.5 border-slate-200 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      checked={sources.length > 0 && selectedIds.length === sources.length}
                      disabled={isCrawling || queue.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(sources.map(s => s.id))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                    />
                  </th>
                  <th className="py-4 px-4 sm:px-6 w-[90px]">Trạng thái</th>
                  <th className="py-4 px-4 sm:px-6">Nguồn cào (URL)</th>
                  <th className="py-4 px-4 sm:px-6 w-[140px] hidden sm:table-cell">Danh mục đích</th>
                  <th className="py-4 px-4 sm:px-6 text-center w-[120px] hidden md:table-cell">Giới hạn ngày</th>
                  <th className="py-4 px-4 sm:px-6 text-center w-[100px] hidden lg:table-cell">Dịch thuật</th>
                  <th className="py-4 px-4 sm:px-6 w-[170px] hidden sm:table-cell">Lần quét cuối</th>
                  <th className="py-4 px-4 sm:px-6 text-right w-[150px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((source) => (
                  <tr key={source.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedIds.includes(source.id) ? 'bg-emerald-50/20' : ''}`}>
                    {/* Checkbox Column */}
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <input
                        type="checkbox"
                        className="w-4.5 h-4.5 border-slate-200 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={selectedIds.includes(source.id)}
                        disabled={isCrawling || queue.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, source.id])
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== source.id))
                          }
                        }}
                      />
                    </td>

                    {/* Toggle Status */}
                    <td className="py-4 px-4 sm:px-6">
                      <button
                        onClick={() => handleToggleStatus(source.id, source.isActive)}
                        disabled={isCrawling || queue.length > 0}
                        className={`transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={source.isActive ? 'Bấm để tạm dừng' : 'Bấm để kích hoạt'}
                      >
                        {source.isActive ? (
                          <ToggleRight className="w-9 h-9 text-emerald-500 cursor-pointer" />
                        ) : (
                          <ToggleLeft className="w-9 h-9 text-slate-300 cursor-pointer" />
                        )}
                      </button>
                    </td>

                    {/* URL */}
                    <td className="py-4 px-4 sm:px-6 max-w-[200px] sm:max-w-xs md:max-w-sm">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-slate-700 hover:text-emerald-600 truncate block"
                          title={source.url}
                        >
                          {formatUrlDisplay(source.url)}
                        </a>
                      </div>
                      {/* Responsive Badges for small screens */}
                      <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold">
                          {source.category.name}
                        </span>
                        {source.daysLimit && (
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-md text-[10px] font-bold">
                            {source.daysLimit} ngày
                          </span>
                        )}
                        {source.isForeign && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[10px] font-bold">
                            Dịch
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Target Category */}
                    <td className="py-4 px-4 sm:px-6 hidden sm:table-cell">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold whitespace-nowrap">
                        {source.category.name}
                      </span>
                    </td>

                    {/* Days Limit */}
                    <td className="py-4 px-4 sm:px-6 text-center text-sm font-bold text-slate-600 hidden md:table-cell">
                      {source.daysLimit} ngày
                    </td>

                    {/* isForeign */}
                    <td className="py-4 px-4 sm:px-6 text-center hidden lg:table-cell">
                      {source.isForeign ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                          <Globe className="w-3.5 h-3.5" /> Có (Dịch)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-lg">
                          Không
                        </span>
                      )}
                    </td>

                    {/* Last Run At */}
                    <td className="py-4 px-4 sm:px-6 text-xs font-medium text-slate-500 hidden sm:table-cell">
                      {source.lastRunAt ? (
                        new Date(source.lastRunAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      ) : (
                        <span className="text-slate-400 italic">Chưa chạy lần nào</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex justify-end gap-1.5 sm:gap-2 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/${source.category.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Xem chuyên mục trên website"
                        >
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => crawlSources([source.id])}
                          disabled={isCrawling || queue.length > 0}
                          className="p-1.5 sm:p-2 text-emerald-600 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-xl transition-all"
                          title="Quét nguồn này"
                        >
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(source)}
                          disabled={isCrawling || queue.length > 0}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-xl transition-all"
                          title="Sửa cấu hình nguồn"
                        >
                          <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSource(source.id)}
                          disabled={isCrawling || queue.length > 0}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:text-slate-300 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-xl transition-all"
                          title="Xóa nguồn quét"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Stop Dialog Modal */}
      {showConfirmStop && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-black text-slate-800">Xác Nhận Dừng Khẩn Cấp</h3>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Bạn có chắc chắn muốn dừng khẩn cấp toàn bộ tiến trình quét đang chạy và xóa bỏ hàng đợi không? Bài viết đang cào dở sẽ bị dừng lại.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmStop(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleStopJob}
                className="px-4 py-2 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-red-500/20"
              >
                Xác nhận dừng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Dialog Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl w-full max-w-5xl my-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-black text-slate-850 tracking-tight">Lịch Sử Đồng Bộ Bài Viết (Cloner)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Từ khóa / ID bài</label>
                <input
                  type="text"
                  placeholder="Nhập tên bài hoặc ID..."
                  value={historyFilters.search}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Danh mục</label>
                <select
                  value={historyFilters.categoryId}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, categoryId: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold text-slate-700"
                >
                  <option value="">-- Tất Cả --</option>
                  {flattenedCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.depth > 0 ? '↳ ' : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Từ ngày</label>
                <input
                  type="date"
                  value={historyFilters.startDate}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Đến ngày</label>
                <input
                  type="date"
                  value={historyFilters.endDate}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>
            </div>

            {/* Modal Content / Table */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-[300px]">
              {loadingHistory ? (
                <div className="h-48 flex items-center justify-center flex-col gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <p className="text-xs text-slate-400 font-bold">Đang tải lịch sử...</p>
                </div>
              ) : historyData.posts.length === 0 ? (
                <div className="h-48 flex items-center justify-center flex-col text-slate-400">
                  <AlertTriangle className="w-10 h-10 text-slate-355 mb-2" />
                  <p className="text-sm font-semibold">Không tìm thấy bài viết nào trong lịch sử quét</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-0">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-450 uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-[80px] text-center hidden sm:table-cell">ID</th>
                        <th className="py-3.5 px-4">Tên bài viết</th>
                        <th className="py-3.5 px-4 hidden md:table-cell">Nguồn cào (URL)</th>
                        <th className="py-3.5 px-4 w-[130px]">Danh mục đích</th>
                        <th className="py-3.5 px-4 w-[160px] hidden sm:table-cell">Ngày cào</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyData.posts.map((post: any) => (
                        <tr key={post.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 text-xs hidden sm:table-cell">{post.id}</td>
                          <td className="py-3.5 px-4 max-w-sm">
                            <a
                              href={`/admin/posts/edit/${post.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-800 hover:text-emerald-600 block truncate"
                              title={post.title}
                            >
                              {post.title}
                            </a>
                            {/* Fallback info for smaller widths */}
                            <div className="mt-1 flex flex-wrap gap-1 md:hidden">
                              {post.aiUrl && (
                                <a
                                  href={post.aiUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-emerald-600 hover:underline max-w-[200px] truncate"
                                >
                                  Nguồn cào
                                </a>
                              )}
                              <span className="text-[10px] text-slate-400 sm:hidden">
                                • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs hidden md:table-cell">
                            {post.aiUrl ? (
                              <a
                                href={post.aiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-slate-400 hover:text-emerald-600 text-xs truncate block"
                                title={post.aiUrl}
                              >
                                {post.aiUrl}
                              </a>
                            ) : (
                              <span className="text-slate-355 italic text-xs">Không có link nguồn</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold whitespace-nowrap block w-max">
                              {post.categories}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-500 hidden sm:table-cell">
                            {new Date(post.createdAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
 
            {/* Modal Footer / Pagination */}
            {historyData.totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-[24px]">
                <span className="text-xs text-slate-500 font-semibold text-center sm:text-left">
                  Hiển thị {(historyFilters.page - 1) * historyFilters.limit + 1} - {Math.min(historyFilters.page * historyFilters.limit, historyData.total)} trên tổng số {historyData.total} dòng
                </span>
                
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    type="button"
                    disabled={historyFilters.page <= 1}
                    onClick={() => setHistoryFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  
                  {Array.from({ length: historyData.totalPages }).map((_, idx) => {
                    const pNum = idx + 1;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setHistoryFilters(prev => ({ ...prev, page: pNum }))}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          historyFilters.page === pNum
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'border border-slate-200 hover:bg-white text-slate-700'
                        }`}
                      >
                        {pNum}
                      </button>
                    )
                  })}
 
                  <button
                    type="button"
                    disabled={historyFilters.page >= historyData.totalPages}
                    onClick={() => setHistoryFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Edit Source Dialog Modal */}
      {editingSource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[900] flex items-center justify-center p-4">
          <form onSubmit={handleUpdateSource} className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-6 max-w-lg w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                Cập Nhật Cấu Hình Nguồn Quét
              </h3>
              <button
                type="button"
                onClick={() => setEditingSource(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đường Dẫn Mục Quét (URL)</label>
                <div className="relative">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    placeholder="Ví dụ: https://vnexpress.net/the-thao/bong-da"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh Mục Đích</label>
                <CategorySearchSelect
                  value={editCategoryId}
                  onChange={(val) => setEditCategoryId(val)}
                  options={flattenedCategories}
                  placeholder="-- Chọn Danh Mục Website --"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giới hạn số ngày đăng bài</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={editDaysLimit}
                    onChange={(e) => setEditDaysLimit(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-semibold"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Chỉ cào bài viết đăng trong vòng X ngày gần đây.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="editIsForeign"
                  checked={editIsForeign}
                  onChange={(e) => setEditIsForeign(e.target.checked)}
                  className="w-5 h-5 border-slate-200 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="editIsForeign" className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer select-none">
                  <Globe className="w-4 h-4 text-slate-400" />
                  Nguồn nước ngoài (Cần AI dịch & biên tập lại)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSource(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isUpdatingSource}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md"
              >
                {isUpdatingSource ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
