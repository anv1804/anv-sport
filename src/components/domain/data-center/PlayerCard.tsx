import Link from 'next/link';

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
    club: { name: string } | null;
    basicInfo: string | null;
  };
}

export function PlayerCard({ player }: PlayerCardProps) {
  let clubName = 'Chưa có CLB';

  if (player.basicInfo) {
    try {
      const info = JSON.parse(player.basicInfo);
      position = info.position || 'Cầu thủ';
      nationality = info.nationality || '';
      height = info.height || '';
      if (info.currentClub) clubName = info.currentClub;
      else if (info.clubName) clubName = info.clubName;
    } catch (e) {}
  }

  if (player.club) {
    clubName = player.club.name;
  }

  return (
    <Link href={`/wiki/${player.slug}-${player.id}`} className="group block bg-white rounded-xl shadow-sm border border-slate-200 hover:border-green-500 transition-colors overflow-hidden">
      <div className="p-4 flex gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          <img 
            src={player.avatar || '/placeholder.jpg'} 
            alt={player.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-800 text-[15px] truncate group-hover:text-green-600 transition-colors">
            {player.name}
          </h3>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">
            {clubName}
          </p>

          <div className="mt-3 flex gap-4">
            <div>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Vị trí</p>
              <p className="font-bold text-slate-700 text-[12px] truncate max-w-[60px]">{position}</p>
            </div>
            {nationality && (
              <div>
                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Quốc tịch</p>
                <p className="font-bold text-slate-700 text-[12px] truncate max-w-[60px]">{nationality}</p>
              </div>
            )}
            {height && (
              <div>
                <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest mb-0.5">Chiều cao</p>
                <p className="font-bold text-slate-700 text-[12px]">{height} cm</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
