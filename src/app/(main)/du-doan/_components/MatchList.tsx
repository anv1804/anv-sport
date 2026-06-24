import { AlertCircle, Trophy } from 'lucide-react';
import MatchCard from './MatchCard';
import MatchListSkeleton from './MatchListSkeleton';
import EmptyStateCard from './EmptyStateCard';
import { type Fixture } from './helpers';

interface Props {
  groupedFixtures: Record<string, Fixture[]>;
  loading: boolean;
  error: string | null;
}

export default function MatchList({ groupedFixtures, loading, error }: Props) {
  if (loading) return <MatchListSkeleton />;

  if (error) {
    return (
      <EmptyStateCard
        icon={<AlertCircle className="w-12 h-12 text-red-500" />}
        title="Lỗi kết nối dữ liệu"
        description={error}
      />
    );
  }

  if (Object.keys(groupedFixtures).length === 0) {
    return (
      <EmptyStateCard
        icon={<Trophy className="w-12 h-12 text-slate-300" />}
        title="Không có trận đấu"
        description="Không tìm thấy trận đấu nào phù hợp với bộ lọc hiện tại."
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {Object.entries(groupedFixtures).map(([dateStr, matches]) => {
        const dateObj = new Date(dateStr);
        const formattedDate = isNaN(dateObj.getTime())
          ? dateStr
          : dateObj.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

        return (
          <div key={dateStr} className="space-y-4">
            <div className="bg-slate-50 px-5 py-3 rounded-xl flex items-center justify-between border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-sm">📅</span>
                <h3 className="text-slate-800 font-extrabold uppercase tracking-widest text-xs md:text-sm">{formattedDate}</h3>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-250/50 px-3 py-0.5 rounded-full uppercase tracking-wider">
                {matches.length} TRẬN
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
