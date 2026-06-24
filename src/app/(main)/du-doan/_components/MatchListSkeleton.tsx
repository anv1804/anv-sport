export default function MatchListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2].map((dateIdx) => (
        <div key={dateIdx} className="space-y-4">
          <div className="bg-slate-900 px-4 md:px-5 py-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded w-40"></div>
            </div>
            <div className="w-16 h-4 bg-slate-800 rounded-full"></div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            {[1, 2, 3].map((rowIdx) => (
              <div key={rowIdx} className="p-4.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-32 h-3.5 bg-gray-200 rounded"></div>
                  <div className="w-24 h-3.5 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex items-center justify-end gap-3">
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                    <div className="w-8 h-6 bg-gray-200 rounded shrink-0"></div>
                  </div>
                  <div className="w-[155px] md:w-[190px] shrink-0 flex flex-col items-center gap-1.5 px-2">
                    <div className="w-12 h-5 bg-gray-200 rounded"></div>
                    <div className="w-full h-1 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="flex-1 flex items-center justify-start gap-3">
                    <div className="w-8 h-6 bg-gray-200 rounded shrink-0"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-[85px] md:w-[105px] shrink-0 pl-1 md:pl-3">
                    <div className="w-full h-8 bg-gray-205 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
