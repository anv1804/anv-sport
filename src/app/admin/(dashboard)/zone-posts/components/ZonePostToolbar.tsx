import { Save, Plus, Loader2 } from 'lucide-react'

export function ZonePostToolbar({
  hasUnsavedChanges,
  isSaving,
  selectedId,
  handleSavePositions,
  setIsModalOpen
}: {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  selectedId: string;
  handleSavePositions: () => void;
  setIsModalOpen: (val: boolean) => void;
}) {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 rounded-t-xl">
      <h2 className="font-bold text-slate-800">
        Các bài viết đang hiển thị
        {hasUnsavedChanges && <span className="text-amber-500 text-xs ml-2 font-medium">(Chưa lưu)</span>}
      </h2>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSavePositions}
          disabled={!hasUnsavedChanges || isSaving}
          className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-sm ${
            hasUnsavedChanges 
              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse shadow-amber-500/20' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
          Lưu vị trí
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedId || hasUnsavedChanges}
          title={hasUnsavedChanges ? "Vui lòng lưu vị trí trước khi thêm bài mới" : ""}
          className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-colors shadow-sm ${
            hasUnsavedChanges 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Thêm bài viết
        </button>
      </div>
    </div>
  )
}
