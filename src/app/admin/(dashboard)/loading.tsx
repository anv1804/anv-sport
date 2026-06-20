export default function DashboardLoading() {
  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-96 bg-slate-100 rounded-md animate-pulse"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-36 bg-emerald-100 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Content Skeleton - Bảng dữ liệu giả */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Bộ lọc giả */}
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="h-10 w-full max-w-sm bg-slate-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Tabs giả */}
        <div className="px-6 border-b border-slate-100 flex gap-6">
          <div className="h-12 w-20 border-b-2 border-emerald-200"></div>
          <div className="h-12 w-24 bg-transparent"></div>
          <div className="h-12 w-24 bg-transparent"></div>
        </div>

        {/* Các dòng dữ liệu giả */}
        <div className="p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-6 p-5 border-b border-slate-50">
              {/* Cột hình ảnh */}
              <div className="w-[120px] h-[80px] rounded bg-slate-100 animate-pulse shrink-0"></div>
              
              {/* Cột nội dung */}
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/4 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse"></div>
              </div>
              
              {/* Cột trạng thái */}
              <div className="w-24 flex items-center justify-center">
                <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse"></div>
              </div>
              
              {/* Cột hành động */}
              <div className="w-20 flex justify-center items-center gap-2">
                <div className="w-8 h-4 rounded-full bg-slate-200 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
