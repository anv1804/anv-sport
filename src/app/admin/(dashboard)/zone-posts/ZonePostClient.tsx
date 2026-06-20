'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, GripVertical, Trash2, Plus, AlertCircle, LayoutTemplate, ListTree, ChevronRight, ChevronDown, FoldVertical, Search, Save, Pin, Clock, Image as ImageIcon } from 'lucide-react'
import { getZonePosts, updateZonePostPositions, removePostFromZone } from './actions'
import { getCategoryPosts, updateCategoryPostPositions, removePostFromCategoryFeatured } from '../category-posts/actions'
import { updatePostStatus } from '../posts/actions'
import { AddPostModal } from './AddPostModal'
import { PrintModal } from './PrintModal'
import { Modal } from '@/components/ui/Modal'
import { ZonePostTable } from './components/ZonePostTable'
import { ZonePostToolbar } from './components/ZonePostToolbar'
import { useConfirm, useAlert } from '@/components/providers/ConfirmProvider'

export function ZonePostClient({ zones, categories }: { zones: any[], categories: any[] }) {
  const confirm = useConfirm()
  const alert = useAlert()
  const [activeTab, setActiveTab] = useState<'ZONE' | 'CATEGORY'>('ZONE')
  const [selectedId, setSelectedId] = useState<string>('')
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printItem, setPrintItem] = useState<any>(null)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingNav, setPendingNav] = useState<{ type: 'TAB' | 'ITEM', value: string } | null>(null)

  const [catSearch, setCatSearch] = useState('')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('anv_sort_tab') as 'ZONE' | 'CATEGORY' | null;
    const savedId = localStorage.getItem('anv_sort_id');
    
    if (savedTab === 'ZONE' || savedTab === 'CATEGORY') {
      setActiveTab(savedTab);
    }
    
    // We defer setting selectedId to the next useEffect to ensure data is loaded
    if (savedId) {
      setTimeout(() => setSelectedId(savedId), 0);
    }
  }, []);

  // Initialize selectedId when tab changes or data loads
  useEffect(() => {
    if (!selectedId) {
      if (activeTab === 'ZONE' && zones.length > 0) {
        setSelectedId(zones[0].id)
      } else if (activeTab === 'CATEGORY' && categories.length > 0) {
        setSelectedId(categories[0].id)
      }
    }
  }, [activeTab, zones, categories, selectedId])

  // Save state to localStorage whenever they change
  useEffect(() => {
    if (activeTab) localStorage.setItem('anv_sort_tab', activeTab);
    if (selectedId) localStorage.setItem('anv_sort_id', selectedId);
  }, [activeTab, selectedId]);

  // Warn on beforeunload if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Standard requirement for modern browsers to show the prompt
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const confirmClose = () => {
    setShowConfirmModal(false);
    setHasUnsavedChanges(false);
    if (pendingNav) {
      if (pendingNav.type === 'TAB') {
        setActiveTab(pendingNav.value as 'ZONE' | 'CATEGORY');
      } else if (pendingNav.type === 'ITEM') {
        setSelectedId(pendingNav.value);
      }
      setPendingNav(null);
    }
  }

  const cancelClose = () => {
    setShowConfirmModal(false);
    setPendingNav(null);
  }

  const loadPosts = async (id: string, tab: 'ZONE' | 'CATEGORY') => {
    if (!id) {
      setPosts([]);
      return;
    }

    setLoading(true)
    if (tab === 'ZONE') {
      const res = await getZonePosts(id)
      if (res.success && res.data) setPosts(res.data)
      else setPosts([])
    } else {
      const res = await getCategoryPosts(id)
      if (res.success && res.data) setPosts(res.data)
      else setPosts([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (selectedId) {
      loadPosts(selectedId, activeTab)
    }
  }, [selectedId, activeTab])

  const handleSavePositions = async () => {
    if (!hasUnsavedChanges || posts.length === 0) return;
    
    setIsSaving(true)
    const updates = posts.map((item, index) => ({
      id: item.id,
      position: index
    }))

    let res;
    if (activeTab === 'ZONE') {
      res = await updateZonePostPositions(selectedId, updates)
    } else {
      res = await updateCategoryPostPositions(selectedId, updates)
    }
    
    if (res && res.success) {
      setHasUnsavedChanges(false)
      // Reload to ensure we have the fresh state (especially replacing temp- IDs)
      await loadPosts(selectedId, activeTab)
    } else {
      await alert('Có lỗi xảy ra khi lưu vị trí!')
    }
    setIsSaving(false)
  }

  const handleRemove = async (id: string) => {
    const ok = await confirm(`Bạn có chắc muốn xóa bài viết này khỏi ${activeTab === 'ZONE' ? 'Zone' : 'Danh mục'}?`)
    if (!ok) return;
    
    setPosts(prev => prev.filter(p => p.id !== id));
    
    // Nếu là bài đang ở database thì xoá luôn, bài temp- thì chỉ cần filter ra khỏi state
    if (activeTab === 'ZONE') {
      if (!id.startsWith('temp-')) await removePostFromZone(id);
    } else {
      if (!id.startsWith('temp-')) await removePostFromCategoryFeatured(id);
    }
    
    // Xoá xong thì đánh dấu là có thay đổi (nếu vị trí các bài khác bị dồn lên)
    // Nhưng vì xoá 1 phần tử không làm sai lệch vị trí tương đối, ta có thể tự động lưu hoặc yêu cầu người dùng bấm lưu.
    setHasUnsavedChanges(true);
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // Build tree for categories
  const categoryRoots = useMemo(() => {
    const map = new Map(categories.map(c => [c.id, { ...c, children: [] }]))
    const roots: any[] = []
    map.forEach(c => {
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(c)
      } else {
        roots.push(c)
      }
    })
    return roots
  }, [categories])

  const renderCategoryTree = (nodes: any[], depth: number = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedCats.has(node.id);
      const matchesSearch = node.name.toLowerCase().includes(catSearch.toLowerCase());
      
      const checkChildMatches = (n: any): boolean => {
        return n.children.some((child: any) => 
          child.name.toLowerCase().includes(catSearch.toLowerCase()) || checkChildMatches(child)
        );
      }
      const childMatches = checkChildMatches(node);
      
      if (catSearch && !matchesSearch && !childMatches) return null;
      const effectivelyExpanded = (catSearch && childMatches) || isExpanded;

      return (
        <div key={node.id} className="w-full">
          <div className="flex items-center relative group">
            <button
              onClick={() => {
                if (selectedId === node.id) return;
                if (hasUnsavedChanges) {
                  setPendingNav({ type: 'ITEM', value: node.id });
                  setShowConfirmModal(true);
                  return;
                }
                setSelectedId(node.id);
              }}
              className={`flex-1 text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors truncate ${
                selectedId === node.id 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
              title={node.name}
            >
              {node.name}
            </button>
            {hasChildren && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const newSet = new Set(expandedCats);
                  if (effectivelyExpanded) newSet.delete(node.id);
                  else newSet.add(node.id);
                  setExpandedCats(newSet);
                }}
                className={`absolute right-1 p-1.5 rounded transition-colors ${selectedId === node.id ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'}`}
              >
                {effectivelyExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
          {hasChildren && effectivelyExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {renderCategoryTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  const listItems = activeTab === 'ZONE' ? zones : categories;
  const targetLabel = activeTab === 'ZONE' ? 'Zone' : 'Danh mục';

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            if (activeTab === 'ZONE') return;
            if (hasUnsavedChanges) {
              setPendingNav({ type: 'TAB', value: 'ZONE' });
              setShowConfirmModal(true);
              return;
            }
            setActiveTab('ZONE');
          }}
          className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'ZONE' 
              ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <LayoutTemplate className="w-4 h-4 mr-2" />
          Sắp xếp theo Zone
        </button>
        <button
          onClick={() => {
            if (activeTab === 'CATEGORY') return;
            if (hasUnsavedChanges) {
              setPendingNav({ type: 'TAB', value: 'CATEGORY' });
              setShowConfirmModal(true);
              return;
            }
            setActiveTab('CATEGORY');
          }}
          className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'CATEGORY' 
              ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ListTree className="w-4 h-4 mr-2" />
          Sắp xếp theo Mục
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar: Select Item */}
        <div className="w-full lg:w-72 flex-shrink-0 sticky top-[24px] z-10">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Danh sách {targetLabel}</h2>
              {activeTab === 'CATEGORY' && (
                <button 
                  onClick={() => setExpandedCats(new Set())} 
                  title="Đóng gọn tất cả" 
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                >
                  <FoldVertical className="w-4 h-4" />
                </button>
              )}
            </div>

            {activeTab === 'CATEGORY' && (
              <div className="p-3 border-b border-slate-100 shrink-0 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Tìm danh mục..." 
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {listItems.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500 italic">Chưa có {targetLabel.toLowerCase()} nào.</div>
              )}
              
              {activeTab === 'ZONE' ? (
                listItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (selectedId === item.id) return;
                      if (hasUnsavedChanges) {
                        setPendingNav({ type: 'ITEM', value: item.id });
                        setShowConfirmModal(true);
                        return;
                      }
                      setSelectedId(item.id)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedId === item.id 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                renderCategoryTree(categoryRoots)
              )}
            </div>
          </div>
        </div>

        {/* Main Area: Posts List */}
        <div className="flex-1 w-full min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
            {/* Toolbar */}
            <ZonePostToolbar 
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              selectedId={selectedId}
              handleSavePositions={handleSavePositions}
              setIsModalOpen={setIsModalOpen}
            />

            {/* List */}
            <div className="p-4 flex-1">
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : posts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
                  <AlertCircle className="w-12 h-12 mb-3 text-slate-300 mx-auto" />
                  <p>Chưa có bài viết nào trong {targetLabel} này.</p>
                  <p className="text-sm mt-1">Bấm "Thêm bài viết" để bắt đầu gắn bài.</p>
                </div>
              ) : (
                <ZonePostTable 
                  posts={posts}
                  setPosts={setPosts}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  handleRemove={handleRemove}
                  setPrintItem={setPrintItem}
                  setIsPrintModalOpen={setIsPrintModalOpen}
                  targetLabel={targetLabel}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <AddPostModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetId={selectedId}
        mode={activeTab}
        onAdded={() => loadPosts(selectedId, activeTab)}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        item={printItem}
        mode={activeTab}
        onSaved={() => loadPosts(selectedId, activeTab)}
      />

      {/* Cảnh báo chưa lưu */}
      <Modal
        isOpen={showConfirmModal}
        onClose={cancelClose}
        title="Cảnh báo thay đổi chưa lưu"
        maxWidth="md"
      >
        <div className="space-y-6">
          <p className="text-slate-600">
            Bạn đang có những thay đổi chưa được lưu. Nếu bạn chuyển trang bây giờ, những thay đổi này sẽ bị mất. Bạn có chắc chắn muốn thoát không?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={cancelClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Tiếp tục chỉnh sửa
            </button>
            <button
              onClick={confirmClose}
              className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors"
            >
              Vẫn thoát và Hủy thay đổi
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
