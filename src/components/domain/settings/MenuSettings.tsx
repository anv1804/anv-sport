import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { MenuItem, SiteMenuSettings } from '@/types/settings'
import { updateSetting } from '@/app/admin/(dashboard)/settings/actions'
import { Save, CheckCircle2, XCircle, Plus, Trash2, GripVertical, Link as LinkIcon, FolderTree, ExternalLink, CornerDownRight, Search, ChevronDown, ChevronRight } from 'lucide-react'

type Category = { id: string; name: string; slug: string; parentId: string | null }

type Props = {
  initialData: SiteMenuSettings
  onSuccess?: () => void
  categories: Category[]
  onDirtyChange?: React.Dispatch<React.SetStateAction<boolean>>
}

// Helpers
const generateId = () => Math.random().toString(36).substring(7)

const updateItemInTree = (items: MenuItem[], id: string, updater: (item: MenuItem) => MenuItem): MenuItem[] => {
  return items.map(item => {
    if (item.id === id) return updater(item)
    if (item.children) return { ...item, children: updateItemInTree(item.children, id, updater) }
    return item
  })
}

const removeItemFromTree = (items: MenuItem[], id: string): MenuItem[] => {
  return items.filter(item => item.id !== id).map(item => {
    if (item.children) return { ...item, children: removeItemFromTree(item.children, id) }
    return item
  })
}

const addChildToItem = (items: MenuItem[], parentId: string, newChild: MenuItem): MenuItem[] => {
  return items.map(item => {
    if (item.id === parentId) return { ...item, children: [...(item.children || []), newChild] }
    if (item.children) return { ...item, children: addChildToItem(item.children, parentId, newChild) }
    return item
  })
}

const moveItemSibling = (items: MenuItem[], draggedId: string, targetId: string): MenuItem[] => {
  let newItems = [...items];
  const draggedIndex = newItems.findIndex(i => i.id === draggedId);
  const targetIndex = newItems.findIndex(i => i.id === targetId);
  
  if (draggedIndex !== -1 && targetIndex !== -1) {
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    const newTargetIndex = newItems.findIndex(i => i.id === targetId);
    newItems.splice(draggedIndex < targetIndex ? newTargetIndex + 1 : newTargetIndex, 0, draggedItem);
    return newItems;
  }
  
  return newItems.map(item => {
    if (item.children && item.children.length > 0) {
      return { ...item, children: moveItemSibling(item.children, draggedId, targetId) };
    }
    return item;
  });
}

function getFlattenedCategories(categories: Category[]) {
  const map = new Map<string, Category & { children: any[] }>();
  categories.forEach(c => map.set(c.id, { ...c, children: [] }));
  const roots: any[] = [];
  categories.forEach(c => {
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)?.children.push(map.get(c.id));
    } else {
      roots.push(map.get(c.id));
    }
  });

  const flat: { id: string, name: string, slug: string, depth: number }[] = [];
  const traverse = (nodes: any[], depth: number) => {
    nodes.forEach(node => {
      flat.push({ id: node.id, name: node.name, slug: node.slug, depth });
      traverse(node.children, depth + 1);
    });
  };
  traverse(roots, 0);
  return flat;
}

import { CategorySearchSelect } from '@/components/ui/CategorySearchSelect'

export function MenuSettings({ initialData, onSuccess, categories, onDirtyChange }: Props) {
  const [items, setItems] = useState<MenuItem[]>(initialData.items || [])
  const [savedItems, setSavedItems] = useState<MenuItem[]>(initialData.items || [])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [attemptedSave, setAttemptedSave] = useState(false)

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(JSON.stringify(items) !== JSON.stringify(savedItems))
    }
  }, [items, savedItems, onDirtyChange])

  const flattenedCategories = useMemo(() => getFlattenedCategories(categories), [categories])

  const { urls, labels, categoryIds, hasEmpty } = useMemo(() => {
    const urls = new Map<string, string>();
    const labels = new Map<string, string>();
    const categoryIds = new Map<string, string>();
    let hasEmpty = false;

    const traverse = (nodes: MenuItem[]) => {
      for (const node of nodes) {
        if (!node.label?.trim() || !node.url?.trim()) {
           if (node.type === 'category' && !node.categoryId) hasEmpty = true;
           else if (node.type === 'custom') hasEmpty = true;
        }
        
        if (node.url?.trim()) {
          const key = node.url.toLowerCase().trim();
          if (!urls.has(key)) urls.set(key, node.id);
          else urls.set(key, 'duplicate');
        }
        if (node.label?.trim()) {
          const key = node.label.toLowerCase().trim();
          if (!labels.has(key)) labels.set(key, node.id);
          else labels.set(key, 'duplicate');
        }
        if (node.categoryId) {
          if (!categoryIds.has(node.categoryId)) categoryIds.set(node.categoryId, node.id);
          else categoryIds.set(node.categoryId, 'duplicate');
        }
        if (node.children) traverse(node.children);
      }
    };
    traverse(items);
    return { urls, labels, categoryIds, hasEmpty };
  }, [items]);

  const handleAddRoot = () => {
    setItems([...items, { id: generateId(), label: '', url: '', type: 'category' }])
    setAttemptedSave(false)
  }

  const handleAddChild = (parentId: string) => {
    setItems(addChildToItem(items, parentId, { id: generateId(), label: '', url: '', type: 'category' }))
    setCollapsedIds(prev => {
      const next = new Set(prev)
      next.delete(parentId)
      return next
    })
    setAttemptedSave(false)
  }

  const handleRemove = (id: string) => {
    setItems(removeItemFromTree(items, id))
  }

  const handleChange = (id: string, updates: Partial<MenuItem>) => {
    setItems(updateItemInTree(items, id, (item) => {
      const updated = { ...item, ...updates }
      // Auto-fill url and label if category selected
      if (updates.categoryId && updated.type === 'category') {
        const cat = flattenedCategories.find(c => c.id === updates.categoryId)
        if (cat) {
          updated.url = `/${cat.slug}`
          updated.label = cat.name
        }
      }
      return updated
    }))
  }

  const handleSave = async () => {
    setAttemptedSave(true);
    
    let firstErrorId: string | null = null;
    const ancestorsToExpand: string[] = [];

    const findError = (nodes: MenuItem[], currentAncestors: string[]) => {
      for (const node of nodes) {
        const isCategoryEmpty = node.type === 'category' && !node.categoryId;
        const isLabelEmpty = node.type === 'custom' && !node.label?.trim();
        const isUrlEmpty = node.type === 'custom' && !node.url?.trim();
        const isThisEmpty = isCategoryEmpty || isLabelEmpty || isUrlEmpty;

        const isDuplicateUrl = node.url && urls.get(node.url.toLowerCase().trim()) === 'duplicate';
        const isDuplicateLabel = node.label && labels.get(node.label.toLowerCase().trim()) === 'duplicate';
        const isDuplicateCategory = node.categoryId && categoryIds.get(node.categoryId) === 'duplicate';
        
        if (isThisEmpty || isDuplicateUrl || isDuplicateLabel || isDuplicateCategory) {
          firstErrorId = node.id;
          ancestorsToExpand.push(...currentAncestors);
          return true;
        }

        if (node.children && node.children.length > 0) {
          if (findError(node.children, [...currentAncestors, node.id])) return true;
        }
      }
      return false;
    };

    findError(items, []);

    if (firstErrorId) {
      if (hasEmpty) {
        setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ Tên và URL hoặc chọn Danh mục cho tất cả các mục.' });
      } else {
        setMessage({ type: 'error', text: 'Có Menu bị trùng Tên hoặc URL. Vui lòng kiểm tra các ô báo đỏ!' });
      }

      if (ancestorsToExpand.length > 0) {
        setCollapsedIds(prev => {
          const next = new Set(prev);
          ancestorsToExpand.forEach(id => next.delete(id));
          return next;
        });
      }

      setTimeout(() => {
        const el = document.getElementById(`menu-item-${firstErrorId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      return;
    }

    setLoading(true)
    setMessage(null)
    const res = await updateSetting('SITE_MENU', JSON.stringify({ items }))
    setLoading(false)
    if (res.success) {
      setSavedItems(items)
      if (onDirtyChange) onDirtyChange(false)
      setMessage({ type: 'success', text: 'Đã lưu cấu hình Menu thành công!' })
      if (onSuccess) setTimeout(onSuccess, 1000)
    } else {
      setMessage({ type: 'error', text: res.error || 'Có lỗi xảy ra' })
    }
  }

  const renderItem = (item: MenuItem, depth: number = 0, ancestorCategoryIds: string[] = [], indexString: string = '') => {
    const isCategory = item.type === 'category'
    const currentAncestors = item.categoryId ? [...ancestorCategoryIds, item.categoryId] : ancestorCategoryIds;
    
    const isDragging = draggedId === item.id;
    const isDragOver = dragOverId === item.id && !isDragging;
    
    const isCategoryEmpty = item.type === 'category' && !item.categoryId;
    const isLabelEmpty = item.type === 'custom' && !item.label?.trim();
    const isUrlEmpty = item.type === 'custom' && !item.url?.trim();
    const isThisEmpty = isCategoryEmpty || isLabelEmpty || isUrlEmpty;

    const isDuplicateUrl = item.url && urls.get(item.url.toLowerCase().trim()) === 'duplicate';
    const isDuplicateLabel = item.label && labels.get(item.label.toLowerCase().trim()) === 'duplicate';
    const isDuplicateCategory = item.categoryId && categoryIds.get(item.categoryId) === 'duplicate';
    
    const hasError = isDuplicateUrl || isDuplicateLabel || isDuplicateCategory || (attemptedSave && isThisEmpty);

    const availableCategories = flattenedCategories.filter(c => {
      const owner = categoryIds.get(c.id);
      return !owner || owner === item.id;
    });
    
    const isCollapsed = collapsedIds.has(item.id);

    return (
      <div 
        id={`menu-item-${item.id}`}
        key={item.id} 
        className="relative focus-within:z-[55]"
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          setDraggedId(item.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverId(item.id);
          e.dataTransfer.dropEffect = 'move';
        }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverId(null);
          if (draggedId && draggedId !== item.id) {
            setItems(prev => moveItemSibling(prev, draggedId, item.id));
          }
          setDraggedId(null);
        }}
        onDragEnd={() => {
          setDraggedId(null);
          setDragOverId(null);
        }}
      >
        <div 
          className={`flex flex-col gap-2 p-3 bg-white rounded-xl border ${hasError ? 'border-red-400 bg-red-50/30' : isDragOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'} ${isDragging ? 'opacity-50' : ''} shadow-sm group hover:${hasError ? 'border-red-500' : 'border-emerald-300'} transition-colors relative`}
        >
          <div className="flex w-full items-start sm:items-center flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1 shrink-0 hidden sm:flex pl-1 pr-1">
              <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 flex items-center">
                <GripVertical className="w-4 h-4 shrink-0" />
              </div>
              {item.children && item.children.length > 0 ? (
                <button 
                  onClick={() => toggleCollapse(item.id)}
                  className="p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center"
                  title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-5 h-5 shrink-0" />
              )}
              <span className="text-slate-400 font-mono text-[13px] min-w-[20px] text-center shrink-0 ml-1">{indexString}</span>
            </div>

            {/* Type selector */}
            <select
              value={item.type || 'custom'}
              onChange={(e) => handleChange(item.id, { type: e.target.value as 'custom' | 'category' })}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-[130px] shrink-0"
            >
              <option value="custom">Link tự do</option>
              <option value="category">Từ danh mục</option>
            </select>

            {/* Inputs based on type */}
            <div className="flex-1 flex gap-2 w-full items-start min-w-0">
              {isCategory ? (
                <>
                  <div className={`flex-[1.2] min-w-0 ${attemptedSave && isCategoryEmpty ? 'rounded-lg border border-red-400 ring-2 ring-red-500/20' : ''}`}>
                    <CategorySearchSelect 
                      value={item.categoryId || ''} 
                      onChange={(val) => handleChange(item.id, { categoryId: val })} 
                      options={availableCategories} 
                    />
                  </div>
                  <div className="flex-[0.8] hidden sm:block min-w-0">
                    <input 
                      type="text"
                      value={item.url || ''}
                      disabled
                      placeholder="Đường dẫn"
                      className={`w-full px-3 py-2 bg-slate-50 border ${isDuplicateUrl ? 'border-red-400 text-red-600' : 'border-slate-200 text-slate-400'} rounded-lg text-sm font-mono cursor-not-allowed min-w-0`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <input 
                    type="text"
                    placeholder="Tên hiển thị"
                    value={item.label}
                    onChange={(e) => handleChange(item.id, { label: e.target.value })}
                    className={`flex-1 px-3 py-2 bg-white border ${isDuplicateLabel || (attemptedSave && isLabelEmpty) ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'} rounded-lg text-sm focus:outline-none focus:ring-2 min-w-0`}
                  />
                  <input 
                    type="text"
                    placeholder="URL (VD: /about)"
                    value={item.url}
                    onChange={(e) => handleChange(item.id, { url: e.target.value })}
                    className={`flex-1 px-3 py-2 bg-white border ${isDuplicateUrl || (attemptedSave && isUrlEmpty) ? 'border-red-400 focus:ring-red-500/50' : 'border-slate-200 focus:ring-emerald-500/50'} rounded-lg text-sm font-mono text-slate-600 focus:outline-none focus:ring-2 min-w-0`}
                  />
                </>
              )}
            </div>

            {/* Target blank toggle */}
            <button
              type="button"
              onClick={() => handleChange(item.id, { target: item.target === '_blank' ? '_self' : '_blank' })}
              className={`p-2 rounded-lg transition-colors shrink-0 ${item.target === '_blank' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100'} mt-1 sm:mt-0`}
              title="Mở trong tab mới"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Actions */}
            <div className="flex gap-1 shrink-0 sm:border-l sm:border-slate-200 sm:pl-2 mt-1 sm:mt-0">
              {depth < 1 && (
                <button 
                  type="button"
                  onClick={() => handleAddChild(item.id)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Thêm menu con"
                >
                  <CornerDownRight className="w-4 h-4" />
                </button>
              )}
              <button 
                type="button"
                onClick={() => handleRemove(item.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa mục"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {hasError && (
            <div className="text-[12px] text-red-500 font-medium pl-[68px]">
              {(attemptedSave && isThisEmpty) 
                ? 'Vui lòng nhập/chọn đầy đủ thông tin cho mục này.' 
                : `Cảnh báo: ${isDuplicateLabel && isDuplicateUrl ? 'Tên hiển thị và Đường dẫn' : isDuplicateLabel ? 'Tên hiển thị' : 'Đường dẫn'} bị trùng lặp với Menu khác.`}
            </div>
          )}
        </div>

        {/* Children render */}
        {item.children && item.children.length > 0 && !isCollapsed && (
          <div className="flex flex-col relative ml-4 sm:ml-7 pl-3 sm:pl-4 border-l-2 border-slate-200 mt-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {item.children.map((child, idx) => renderItem(child, depth + 1, currentAncestors, `${indexString}${idx + 1}.`))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-auto custom-scrollbar px-8 py-4 md:py-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <p className="text-sm text-slate-500 max-w-2xl">
              Có thể Kéo Thả (Drag & Drop) vào biểu tượng 6 chấm để sắp xếp các mục. Chỉ hỗ trợ tối đa 2 cấp Menu (Menu gốc và Menu con).
            </p>
            <Button onClick={handleAddRoot} variant="secondary" type="button" className="flex items-center gap-2 shadow-sm shrink-0">
              <Plus className="w-4 h-4" /> Thêm Menu gốc
            </Button>
          </div>

          <div className="bg-slate-50/50 rounded-2xl p-4 sm:p-6 border border-slate-100 w-full min-w-fit">
            {items.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Chưa có mục nào trong menu. Hãy bấm "Thêm Menu gốc" để bắt đầu!
              </div>
            ) : (
              <div className="flex flex-col gap-4 md:gap-6">
                {items.map((item, idx) => renderItem(item, 0, [], `${idx + 1}.`))}
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {message.text}
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 shrink-0 flex justify-end">
        <Button onClick={handleSave} isLoading={loading} type="button" className="flex items-center gap-2 shadow-md">
          <Save className="w-4 h-4" />
          Lưu cấu hình
        </Button>
      </div>
    </>
  )
}
