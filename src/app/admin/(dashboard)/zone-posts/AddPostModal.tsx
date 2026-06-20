'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Loader2, Search, CheckSquare, Square } from 'lucide-react'
import { searchPostsForZone, addPostsToZone } from './actions'
import { addPostsToCategoryFeatured } from '../category-posts/actions'
import { useAlert } from '@/components/providers/ConfirmProvider'

type AddPostModalProps = {
  isOpen: boolean
  onClose: () => void
  targetId: string
  mode: 'ZONE' | 'CATEGORY'
  onAdded: () => void
}

export function AddPostModal({ isOpen, onClose, targetId, mode, onAdded }: AddPostModalProps) {
  const alert = useAlert()
  const [keyword, setKeyword] = useState('')
  const [timeRange, setTimeRange] = useState('all') // all, 7days, 30days
  const [categoryId, setCategoryId] = useState('') 
  
  const [posts, setPosts] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const res = await searchPostsForZone({ keyword, timeRange, categoryId })
    if (res.success && res.data) {
      setPosts(res.data)
    }
    setLoading(false)
  }

  // Load initially when modal opens
  useEffect(() => {
    if (isOpen) {
      setKeyword('')
      setTimeRange('all')
      setCategoryId('')
      setSelectedIds([])
      handleSearch()
    }
  }, [isOpen])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === posts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(posts.map(p => p.id))
    }
  }

  const handleAdd = async () => {
    if (selectedIds.length === 0) return;
    setAdding(true)
    let res;
    if (mode === 'ZONE') {
      res = await addPostsToZone(targetId, selectedIds)
    } else {
      res = await addPostsToCategoryFeatured(targetId, selectedIds)
    }
    
    setAdding(false)
    if (res.success) {
      onAdded()
      onClose()
    } else {
      await alert(res?.error || 'Có lỗi xảy ra')
    }
  }

  const label = mode === 'ZONE' ? 'Zone' : 'Danh mục'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thêm bài viết vào ${label}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="md:col-span-2">
            <Input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề bài viết..."
            />
          </div>
          <div>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              <option value="all">Thời gian: Tất cả</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>
          <Button onClick={handleSearch} variant="success" disabled={loading} className="h-10">
            Lọc kết quả
          </Button>
        </div>

        {/* Results List */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center px-4 py-3 bg-slate-100 border-b border-slate-200">
            <button onClick={toggleSelectAll} className="mr-3 text-emerald-600 hover:text-emerald-700">
              {posts.length > 0 && selectedIds.length === posts.length ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </button>
            <span className="text-sm font-bold text-slate-700">Chọn tất cả ({posts.length} bài)</span>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Không tìm thấy bài viết nào phù hợp.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {posts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => toggleSelect(post.id)}
                    className={`flex items-start p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedIds.includes(post.id) ? 'bg-emerald-50/50' : ''}`}
                  >
                    <div className="mr-3 mt-0.5 text-emerald-600">
                      {selectedIds.includes(post.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-300" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{post.title}</h4>
                      <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{post.categories[0]?.name || 'Không có mục'}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-600">
            Đã chọn: <strong className="text-emerald-600">{selectedIds.length}</strong> bài viết
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={adding}>Hủy</Button>
            <Button onClick={handleAdd} variant="success" disabled={adding || selectedIds.length === 0} className="min-w-[120px]">
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Xác nhận Thêm
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
