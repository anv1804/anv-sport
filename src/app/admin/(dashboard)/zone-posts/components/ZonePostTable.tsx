import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, Trash2, Pin, Clock, Image as ImageIcon, ChevronDown } from 'lucide-react'
import { updatePostStatus } from '../../posts/actions'

export function ZonePostTable({
  posts,
  setPosts,
  setHasUnsavedChanges,
  handleRemove,
  setPrintItem,
  setIsPrintModalOpen,
  targetLabel
}: {
  posts: any[];
  setPosts: (posts: any[]) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  handleRemove: (id: string) => void;
  setPrintItem: (item: any) => void;
  setIsPrintModalOpen: (val: boolean) => void;
  targetLabel: string;
}) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(posts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPosts(items);
    setHasUnsavedChanges(true);
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="zone-posts">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {posts.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => {
                  const now = new Date();
                  const isPrintedValid = item.isPrinted && (!item.printStartTime || new Date(item.printStartTime) <= now) && (!item.printEndTime || new Date(item.printEndTime) > now);
                  const isPrintedFuture = item.isPrinted && item.printStartTime && new Date(item.printStartTime) > now;
                  
                  return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group flex items-center p-3 md:p-4 bg-white border rounded-xl shadow-sm transition-all duration-200 ${
                          snapshot.isDragging ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20 z-50 scale-[1.02]' : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                        } ${isPrintedValid ? 'border-l-[6px] border-l-emerald-500 bg-emerald-50/30' : ''} ${isPrintedFuture ? 'border-l-[6px] border-l-indigo-400 bg-indigo-50/30' : ''}`}
                      >
                        <div {...provided.dragHandleProps} className="p-2 text-slate-400 hover:text-emerald-600 cursor-grab active:cursor-grabbing transition-colors">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 ml-1 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                          {index + 1}
                        </div>
                        {item.post.imageUrl ? (
                          <img src={item.post.imageUrl} alt="" className="w-20 h-14 md:w-28 md:h-16 object-cover rounded-lg shrink-0 ml-3 border border-slate-200 shadow-sm" />
                        ) : (
                          <div className="w-20 h-14 md:w-28 md:h-16 bg-slate-50 rounded-lg shrink-0 ml-3 flex items-center justify-center border border-slate-200 shadow-sm">
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 ml-4 flex flex-col justify-center">
                          <h3 className="font-bold text-slate-800 text-sm md:text-[15px] leading-snug line-clamp-2 md:line-clamp-1 mb-1 flex items-center gap-2 group-hover:text-emerald-700 transition-colors">
                            {item.post.title}
                            {isPrintedValid && (
                              <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider shadow-sm ml-1">
                                <Pin className="w-3 h-3 mr-1" />
                                Đã ghim
                              </span>
                            )}
                            {isPrintedFuture && (
                              <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider shadow-sm ml-1">
                                <Clock className="w-3 h-3 mr-1" />
                                Sắp ghim
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap items-center text-xs text-slate-500 gap-2 md:gap-3">
                            <span className="font-mono font-medium text-slate-400">#{item.post.id}</span>
                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                            <span className="font-semibold text-emerald-600">
                              {item.post.categories[0]?.name || 'Không có chuyên mục'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                            <span>{formatDate(item.post.createdAt)}</span>
                            {isPrintedValid && item.printEndTime && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-amber-300"></div>
                                <span className="text-amber-600 font-medium">
                                  Hết hạn: {formatDate(item.printEndTime)}
                                </span>
                              </>
                            )}
                            {isPrintedFuture && item.printStartTime && (
                              <>
                                <div className="w-1 h-1 rounded-full bg-indigo-300"></div>
                                <span className="text-indigo-600 font-medium">
                                  Bắt đầu: {formatDate(item.printStartTime)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                          <div className="relative hidden md:block mr-2">
                            <select
                              value={item.post.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                const newPosts = [...posts];
                                const idx = newPosts.findIndex(p => p.id === item.id);
                                if (idx > -1) {
                                  newPosts[idx] = { ...newPosts[idx], post: { ...newPosts[idx].post, status: newStatus } };
                                  setPosts(newPosts);
                                }
                                await updatePostStatus(item.post.id, newStatus);
                              }}
                              className={`font-bold pl-3 pr-8 py-1.5 rounded-lg text-[10px] md:text-xs uppercase tracking-wider outline-none cursor-pointer border shadow-sm transition-colors appearance-none ${item.post.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                            >
                              <option value="PUBLISHED">Đã xuất bản</option>
                              <option value="DRAFT">Bản nháp</option>
                            </select>
                            <ChevronDown className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${item.post.status === 'PUBLISHED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          </div>
                          <button
                            onClick={() => {
                              setPrintItem(item);
                              setIsPrintModalOpen(true);
                            }}
                            className={`p-2 rounded-lg transition-all ${(isPrintedValid || isPrintedFuture) ? 'text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm hover:shadow' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            title="Cấu hình Print (Ghim)"
                          >
                            <Pin className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={`Gỡ khỏi ${targetLabel}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                  )
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
