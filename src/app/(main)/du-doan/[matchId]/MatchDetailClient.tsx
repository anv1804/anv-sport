"use client";

import { useState, useEffect } from 'react';
import { PredictionView, PredictionData } from '@/components/domain/article/PredictionView';
import { Button } from '@/components/ui/Button';
import { Bot, AlertTriangle, ArrowLeft, Calendar, ShieldAlert, PlayCircle, Info, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { getWinProbability } from '@/lib/utils';

const getPlayerEventsSummary = (player: any, events: any[] = []) => {
  const summary = {
    goals: 0,
    ownGoals: 0,
    yellowCards: 0,
    redCard: false,
    secondYellow: false,
    subbedOut: false,
    subbedIn: false,
    subMinute: null as number | null,
    assists: 0,
    injury: false
  };

  if (!events || !player) return summary;

  const pName = (player.name || '').toLowerCase();
  const pId = player.id;

  events.forEach(evt => {
    const evtPlayerName = (evt.player?.name || '').toLowerCase();
    const evtPlayerId = evt.player?.id;
    const evtAssistName = (evt.assist?.name || '').toLowerCase();
    const evtAssistId = evt.assist?.id;

    const isPrimaryPlayer = pId && evtPlayerId ? pId === evtPlayerId : (evtPlayerName.includes(pName) || pName.includes(evtPlayerName));
    const isAssistPlayer = pId && evtAssistId ? pId === evtAssistId : (evtAssistName.includes(pName) || pName.includes(evtAssistName));

    if (evt.type === 'Goal') {
      if (isPrimaryPlayer) {
        if (evt.detail === 'Own Goal') {
          summary.ownGoals++;
        } else {
          summary.goals++;
        }
      }
      if (isAssistPlayer && evt.detail !== 'Own Goal') {
        summary.assists++;
      }
    } else if (evt.type === 'Card') {
      if (isPrimaryPlayer) {
        if (evt.detail === 'Yellow Card') {
          summary.yellowCards++;
        } else if (evt.detail === 'Second Yellow Card') {
          summary.secondYellow = true;
          summary.redCard = true;
        } else if (evt.detail === 'Red Card') {
          summary.redCard = true;
        }
      }
    } else if (evt.type === 'subst') {
      if (isPrimaryPlayer) {
        summary.subbedIn = true;
        summary.subMinute = evt.time?.elapsed || null;
      }
      if (isAssistPlayer) {
        summary.subbedOut = true;
        summary.subMinute = evt.time?.elapsed || null;
        if (evt.detail?.toLowerCase().includes('injury') || evt.comment?.toLowerCase().includes('injury')) {
          summary.injury = true;
        }
      }
    }
  });

  return summary;
};

const PlayerListIndicators = ({ summary, isAlignRight }: { summary: any, isAlignRight?: boolean }) => {
  const content = (
    <>
      {summary.goals > 0 && (
        <span className="text-[11px]" title={`Ghi bàn: ${summary.goals}`}>⚽{summary.goals > 1 ? summary.goals : ''}</span>
      )}
      {summary.ownGoals > 0 && (
        <span className="text-[11px] text-red-500 animate-pulse" title="Phản lưới nhà">⚽🔴</span>
      )}
      {summary.yellowCards > 0 && !summary.secondYellow && (
        <span className="w-2 h-3 bg-yellow-400 border border-yellow-500 rounded-[1px] inline-block shadow-sm" title="Thẻ vàng"></span>
      )}
      {summary.secondYellow && (
        <span className="text-[10px] inline-block" title="2 thẻ vàng">🟨🟥</span>
      )}
      {summary.redCard && !summary.secondYellow && (
        <span className="w-2 h-3 bg-red-500 border border-red-600 rounded-[1px] inline-block shadow-sm animate-pulse" title="Thẻ đỏ"></span>
      )}
      {summary.assists > 0 && (
        <span className="text-[11px]" title={`Kiến tạo: ${summary.assists}`}>👟{summary.assists > 1 ? summary.assists : ''}</span>
      )}
      {summary.subbedOut && (
        <span className="text-[10px] text-red-500 font-black inline-flex items-center gap-0.5" title={`Thay ra phút ${summary.subMinute}'`}>
          {isAlignRight ? `${summary.subMinute}' ↓` : `↓ ${summary.subMinute}'`}
        </span>
      )}
      {summary.subbedIn && (
        <span className="text-[10px] text-green-600 font-black inline-flex items-center gap-0.5" title={`Vào sân phút ${summary.subMinute}'`}>
          {isAlignRight ? `${summary.subMinute}' ↑` : `↑ ${summary.subMinute}'`}
        </span>
      )}
    </>
  );

  return (
    <div className={`flex items-center gap-1.5 ${isAlignRight ? 'flex-row-reverse' : ''}`}>
      {content}
    </div>
  );
};

const PlayerIcon = ({ player, teamName, isTop, events }: { player: any, teamName: string, isTop: boolean, events: any[] }) => {
  const avatarUrl = player.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(player.name)}`;
  const summary = getPlayerEventsSummary(player, events);
  
  return (
    <div className="flex flex-col items-center group relative z-10 w-[44px] sm:w-[56px]">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 overflow-hidden relative transition-transform group-hover:scale-110 group-hover:z-20 shadow-[0_2px_6px_rgba(0,0,0,0.3)] border-[1.5px] border-white/20">
        <img src={avatarUrl} alt={player.name} className="w-full h-full object-cover" />
        
        {/* Badges */}
        {summary.subbedOut && (
          <div className="absolute bottom-0 right-0 bg-red-600 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white text-[8px] text-white font-bold" title={`Thay ra phút ${summary.subMinute}'`}>
            ↓
          </div>
        )}
        {summary.subbedIn && (
          <div className="absolute bottom-0 right-0 bg-green-600 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white text-[8px] text-white font-bold" title={`Vào sân phút ${summary.subMinute}'`}>
            ↑
          </div>
        )}
        {summary.goals > 0 && (
          <div className="absolute top-0 left-0 bg-white rounded-full w-3.5 h-3.5 flex items-center justify-center border border-slate-300 text-[8px] shadow" title={`Ghi ${summary.goals} bàn`}>
            ⚽{summary.goals > 1 ? summary.goals : ''}
          </div>
        )}
        {summary.ownGoals > 0 && (
          <div className="absolute top-0 left-0 bg-red-100 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-red-300 text-[8px] shadow animate-pulse" title={`Phản lưới nhà`}>
            ⚽🔴
          </div>
        )}
        {summary.yellowCards > 0 && !summary.secondYellow && (
          <div className="absolute top-0 right-0 bg-yellow-400 rounded-[1px] w-2.5 h-3.5 flex items-center justify-center border border-yellow-500 shadow" title="Thẻ vàng">
          </div>
        )}
        {summary.secondYellow && (
          <div className="absolute top-0 right-0 bg-yellow-500 rounded-[1px] w-3.5 h-3.5 flex items-center justify-center border border-yellow-600 shadow" title="2 thẻ vàng">
             🟨🟥
          </div>
        )}
        {summary.redCard && !summary.secondYellow && (
          <div className="absolute top-0 right-0 bg-red-500 rounded-[1px] w-2.5 h-3.5 flex items-center justify-center border border-red-600 shadow animate-pulse" title="Thẻ đỏ">
          </div>
        )}
        {summary.assists > 0 && (
          <div className="absolute bottom-0 left-0 bg-blue-100 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-blue-300 text-[8px] shadow" title={`Kiến tạo ${summary.assists} bàn`}>
            👟
          </div>
        )}
      </div>
      
      {/* Name and Number on grass */}
      <div className="mt-1 text-[8px] sm:text-[9.5px] text-white/95 text-center truncate w-[160%] max-w-[80px] tracking-tight font-medium" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.9), 0px 1px 1px rgba(0,0,0,0.5)' }}>
        <span className="font-normal opacity-80 mr-0.5">{player.number}</span> {player.name}
      </div>
    </div>
  );
};

const PitchLineup = ({ team1, team2, formationsData, events }: { team1: any, team2: any, formationsData: any, events: any[] }) => {
  const getPlayersWithPositions = (teamInfo: any, isTopTeam: boolean) => {
    if (!teamInfo || !teamInfo.startXI || teamInfo.startXI.length === 0 || !teamInfo.formation) return [];
    
    const dbCoords = formationsData ? formationsData[teamInfo.formation] : null;
    
    if (dbCoords && dbCoords.length === teamInfo.startXI.length) {
      return teamInfo.startXI.map((p: any, index: number) => {
        const coord = dbCoords[index];
        const absoluteY = isTopTeam ? (coord.y / 2) : (100 - (coord.y / 2));
        const absoluteX = isTopTeam ? (100 - coord.x) : coord.x;
        
        return {
          player: p.player,
          x: absoluteX,
          y: absoluteY
        };
      });
    }
    
    const parts = teamInfo.formation.split('-').map(Number);
    const N = parts.length;
    const flatPlayers = [];
    
    flatPlayers.push({
      player: teamInfo.startXI[0].player,
      x: 50,
      y: isTopTeam ? 4 : 96
    });
    
    let currentIndex = 1;
    for (let i = 0; i < N; i++) {
      const count = parts[i];
      let yHalf = 50;
      if (N > 1) {
         yHalf = 25 + (60 / (N - 1)) * i; 
      }
      let absoluteY = isTopTeam ? (yHalf / 2) : (100 - (yHalf / 2));
      
      for (let j = 0; j < count; j++) {
        const rawX = (100 / (count + 1)) * (j + 1);
        const absoluteX = isTopTeam ? (100 - rawX) : rawX;
        
        if (teamInfo.startXI[currentIndex]) {
          flatPlayers.push({
            player: teamInfo.startXI[currentIndex].player,
            x: absoluteX,
            y: absoluteY
          });
        }
        currentIndex++;
      }
    }
    return flatPlayers;
  };

  const t1Players = getPlayersWithPositions(team1, false);
  const t2Players = getPlayersWithPositions(team2, true);
  return (
    <div 
      className="relative w-full mx-auto bg-[#4B6B4A] rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-slate-800 font-sans flex-shrink-0"
      style={{ 
        aspectRatio: '2/3',
        maxHeight: '75vh',
        maxWidth: 'calc(75vh * 0.666)',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(255,255,255,0.025) 10%, rgba(255,255,255,0.025) 20%)' 
      }}
    >
      
      {/* Team Headers */}
      <div className="absolute top-0 left-0 w-full p-2 sm:p-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <img src={team2?.team?.logo} className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm shadow-sm" alt="logo" />
          <span className="text-white font-bold text-[11px] sm:text-[13px]">{team2?.team?.name}</span>
        </div>
        <div className="bg-black/30 px-2 py-1 rounded text-white/80 font-bold text-[10px] sm:text-[11px]">{team2?.formation}</div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-2 sm:p-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2">
          <img src={team1?.team?.logo} className="w-5 h-5 sm:w-7 sm:h-7 rounded-sm shadow-sm" alt="logo" />
          <span className="text-white font-bold text-[10px] sm:text-[12px]">{team1?.team?.name}</span>
        </div>
        <div className="bg-black/30 px-2 py-1 rounded text-white/80 font-bold text-[9px] sm:text-[10px]">{team1?.formation}</div>
      </div>

      {/* Pitch Lines */}
      <div className="absolute inset-0 pointer-events-none border-[1.5px] border-white/20 m-2 sm:m-4">
        <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-white/20 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-[60px] h-[60px] sm:w-[90px] sm:h-[90px] rounded-full border-[1.5px] border-white/20 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="absolute top-0 left-1/2 w-[140px] sm:w-[180px] h-[45px] sm:h-[60px] border-[1.5px] border-t-0 border-white/20 -translate-x-1/2"></div>
        <div className="absolute top-0 left-1/2 w-[60px] sm:w-[80px] h-[15px] sm:h-[20px] border-[1.5px] border-t-0 border-white/20 -translate-x-1/2"></div>
        <div className="absolute top-[45px] sm:top-[60px] left-1/2 w-[40px] sm:w-[60px] h-[20px] sm:h-[30px] border-[1.5px] border-white/20 rounded-b-full border-t-0 -translate-x-1/2"></div>
        
        <div className="absolute bottom-0 left-1/2 w-[140px] sm:w-[180px] h-[45px] sm:h-[60px] border-[1.5px] border-b-0 border-white/20 -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-[60px] sm:w-[80px] h-[15px] sm:h-[20px] border-[1.5px] border-b-0 border-white/20 -translate-x-1/2"></div>
        <div className="absolute bottom-[45px] sm:bottom-[60px] left-1/2 w-[40px] sm:w-[60px] h-[20px] sm:h-[30px] border-[1.5px] border-white/20 rounded-t-full border-b-0 -translate-x-1/2"></div>
      </div>

      <div className="absolute inset-0 m-2 sm:m-4">
          {/* Team 2 */}
          {t2Players.map((p: any, i: number) => (
            <div key={`t2-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
               <PlayerIcon player={p.player} teamName={team2?.team?.name || ''} isTop={true} events={events} />
            </div>
          ))}
          
          {/* Team 1 */}
          {t1Players.map((p: any, i: number) => (
            <div key={`t1-${i}`} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
               <PlayerIcon player={p.player} teamName={team1?.team?.name || ''} isTop={false} events={events} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default function MatchDetailClient({ matchId }: { matchId: string }) {
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);
  const [formationsData, setFormationsData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/formations')
      .then(res => res.ok && res.headers.get("content-type")?.includes("application/json") ? res.json() : { success: false })
      .then(data => {
        if (data.success) {
          setFormationsData(data.data);
        }
      })
      .catch(err => console.error("Error fetching formations:", err));
  }, []);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerated, setAutoGenerated] = useState(false);
  const [isDataPreview, setIsDataPreview] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'dienbien' | 'doihinh' | 'thongke'>('thongke');
  const [attemptedMilestones, setAttemptedMilestones] = useState<Record<string, boolean>>({});
  const [showAllStats, setShowAllStats] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<'PRE_MATCH' | 'START_MATCH' | 'HALF_TIME' | 'LIVE'>('PRE_MATCH');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/generate-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ historyOnly: true, matchId })
        });
        if (!res.ok) {
          console.error("Non-ok status from generate-prediction:", res.status);
          return;
        }
        if (!res.headers.get("content-type")?.includes("application/json")) {
          console.error("Non-JSON response from generate-prediction history query");
          return;
        }
        const data = await res.json();
        if (data.success && data.history) {
          setPredictionHistory(data.history);
          if (data.history.length > 0) {
            setPredictionData(data.history[0].prediction);
            const latestMilestone = data.history[0].milestone;
            if (['PRE_MATCH', 'START_MATCH', 'HALF_TIME'].includes(latestMilestone)) {
              setSelectedMilestone(latestMilestone as any);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải lịch sử nhận định", err);
      } finally {
        setHistoryLoaded(true);
      }
    };
    if (matchId) {
      fetchHistory();
    }
  }, [matchId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/fixtures?id=${matchId}`);
        if (!res.ok) {
          setError(`Lỗi kết nối máy chủ API lịch thi đấu (Mã lỗi: ${res.status})`);
          setLoadingMatch(false);
          return;
        }
        if (!res.headers.get("content-type")?.includes("application/json")) {
          setError("Không tải được dữ liệu trận đấu (Phản hồi không phải JSON)");
          setLoadingMatch(false);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setMatchInfo(data.data);
          
          // If match is live, start polling every 10 seconds
          const statusLower = (data.data?.status || '').toLowerCase();
          const isFinished = statusLower === 'ft' || 
                             statusLower === 'aet' || 
                             statusLower === 'pen' || 
                             statusLower === 'finished' || 
                             statusLower.includes('kết thúc') ||
                             statusLower.includes('đã kết thúc');
          const isLive = !isFinished && 
                         statusLower !== 'chưa diễn ra' && 
                         statusLower !== 'upcoming' && 
                         statusLower !== 'ns' && 
                         statusLower !== 'tbd' &&
                         statusLower !== 'chưa đá' &&
                         !statusLower.includes('chưa đá') &&
                         !statusLower.includes('scheduled') &&
                         !statusLower.includes('chưa bắt đầu') &&
                         !statusLower.includes('chưa diễn ra');

          if (isLive && !intervalId) {
            intervalId = setInterval(fetchMatch, 10000);
          }
        } else {
          setError(data.error || "Không tìm thấy thông tin trận đấu này.");
        }
      } catch (err) {
        console.error("Lỗi tải trận đấu", err);
        setError("Lỗi kết nối máy chủ API lịch thi đấu");
      } finally {
        setLoadingMatch(false);
      }
    };
    
    fetchMatch();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [matchId]);

  // Ensure selected milestone is available based on match state
  useEffect(() => {
    if (!matchInfo) return;
    const statusLower = (matchInfo.status || '').toLowerCase();
    const isFinished = statusLower === 'ft' || 
                       statusLower === 'aet' || 
                       statusLower === 'pen' || 
                       statusLower === 'finished' || 
                       statusLower.includes('kết thúc') ||
                       statusLower.includes('đã kết thúc');

    const isLive = !isFinished && 
                   statusLower !== 'chưa diễn ra' && 
                   statusLower !== 'upcoming' && 
                   statusLower !== 'ns' && 
                   statusLower !== 'tbd' &&
                   statusLower !== 'chưa đá' &&
                   !statusLower.includes('chưa đá') &&
                   !statusLower.includes('scheduled') &&
                   !statusLower.includes('chưa bắt đầu') &&
                   !statusLower.includes('chưa diễn ra');

    const livePeriodLower = (matchInfo.livePeriod || '').toLowerCase();
    const isSecondHalf = isLive && (
      statusLower.includes('2nd half') || 
      statusLower.includes('hiệp 2') || 
      livePeriodLower.includes('2nd') || 
      livePeriodLower.includes('hiệp 2')
    );

    let isPastStartTime = false;
    if (matchInfo.matchDate && matchInfo.matchTime) {
      try {
        let datePart = matchInfo.matchDate;
        if (datePart.includes('/')) {
          const parts = datePart.split('/');
          datePart = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        const scheduledDate = new Date(`${datePart}T${matchInfo.matchTime}:00`);
        if (!isNaN(scheduledDate.getTime()) && Date.now() >= scheduledDate.getTime()) {
          isPastStartTime = true;
        }
      } catch (e) {}
    }

    let isAvailable = false;
    if (selectedMilestone === 'PRE_MATCH') {
      isAvailable = true;
    } else if (selectedMilestone === 'START_MATCH') {
      isAvailable = isLive || isFinished || isPastStartTime;
    } else if (selectedMilestone === 'HALF_TIME') {
      isAvailable = isSecondHalf || isFinished;
    } else if (selectedMilestone === 'LIVE') {
      isAvailable = isLive || isFinished || isPastStartTime;
    }

    if (!isAvailable) {
      setSelectedMilestone('PRE_MATCH');
      const preMatchHist = predictionHistory.find(h => h.milestone === 'PRE_MATCH');
      if (preMatchHist) {
        setPredictionData(preMatchHist.prediction);
      } else {
        setPredictionData(null);
      }
    }
  }, [matchInfo, selectedMilestone, predictionHistory]);

  // Hook for background auto-generation based on match state (3 default milestones: PRE_MATCH, START_MATCH, HALF_TIME)
  useEffect(() => {
    if (!matchInfo || loadingMatch || !historyLoaded || isGenerating) return;

    const statusLower = (matchInfo.status || '').toLowerCase();
    const isFinished = statusLower === 'ft' || 
                       statusLower === 'aet' || 
                       statusLower === 'pen' || 
                       statusLower === 'finished' || 
                       statusLower.includes('kết thúc') ||
                       statusLower.includes('đã kết thúc');

    const isLive = statusLower !== 'chưa diễn ra' && 
                   statusLower !== 'upcoming' && 
                   statusLower !== 'ns' && 
                   statusLower !== 'tbd' &&
                   statusLower !== 'chưa đá' &&
                   !statusLower.includes('chưa đá') &&
                   !statusLower.includes('scheduled') &&
                   !statusLower.includes('chưa bắt đầu') &&
                   !statusLower.includes('chưa diễn ra');

    const triggerAutoGeneration = async () => {
      const hasPreMatch = predictionHistory.some(hist => hist.milestone === 'PRE_MATCH');
      const hasStartMatch = predictionHistory.some(hist => hist.milestone === 'START_MATCH');
      const hasHalfTime = predictionHistory.some(hist => hist.milestone === 'HALF_TIME');

      // Milestone 1: Trước trận (PRE_MATCH) - Trước khi trận đấu diễn ra (luôn tự động tạo nếu chưa có)
      if (!hasPreMatch && !attemptedMilestones.PRE_MATCH) {
        setAttemptedMilestones(prev => ({ ...prev, PRE_MATCH: true }));
        setLoadingText("Siêu máy tính đang tạo nhận định Trước trận...");
        await handleGenerateInternal(false, 'PRE_MATCH');
        return;
      }

      // Milestone 2: Đầu trận (START_MATCH) - Khi trận đấu đã bắt đầu hiệp 1 hoặc đã kết thúc hoặc đã đến/qua giờ đá
      let isPastStartTime = false;
      if (matchInfo.matchDate && matchInfo.matchTime) {
        try {
          // matchDate format can be DD/MM/YYYY or YYYY-MM-DD
          let datePart = matchInfo.matchDate;
          if (datePart.includes('/')) {
            const parts = datePart.split('/');
            datePart = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          const scheduledDate = new Date(`${datePart}T${matchInfo.matchTime}:00`);
          if (!isNaN(scheduledDate.getTime()) && Date.now() >= scheduledDate.getTime()) {
            isPastStartTime = true;
          }
        } catch (e) {}
      }

      if (isLive || isFinished || isPastStartTime) {
        if (!hasStartMatch && !attemptedMilestones.START_MATCH) {
          setAttemptedMilestones(prev => ({ ...prev, START_MATCH: true }));
          setLoadingText("Siêu máy tính đang tạo nhận định Đầu trận...");
          await handleGenerateInternal(false, 'START_MATCH');
          return;
        }
      }

      // Milestone 3: Giữa trận (HALF_TIME) - Khi hiệp 2 bắt đầu hoặc đã kết thúc
      const livePeriodLower = (matchInfo.livePeriod || '').toLowerCase();
      const isSecondHalfOrFinished = isFinished || statusLower.includes('2nd half') || statusLower.includes('hiệp 2') || livePeriodLower.includes('2nd') || livePeriodLower.includes('hiệp 2');
      if (isSecondHalfOrFinished) {
        if (!hasHalfTime && !attemptedMilestones.HALF_TIME) {
          setAttemptedMilestones(prev => ({ ...prev, HALF_TIME: true }));
          setLoadingText("Siêu máy tính đang tạo nhận định Giữa trận...");
          await handleGenerateInternal(false, 'HALF_TIME');
          return;
        }
      }

      // Fallback: Nếu hoàn toàn chưa có dự đoán nào, tạo bản xem thử thời gian thực (không lưu)
      if (predictionHistory.length === 0 && !attemptedMilestones.fallback) {
        setAttemptedMilestones(prev => ({ ...prev, fallback: true }));
        setLoadingText("Siêu máy tính đang tự động phân tích diễn biến trận đấu trực tiếp...");
        await handleGenerateInternal(true);
      }
    };

    triggerAutoGeneration();
  }, [matchInfo, predictionHistory, loadingMatch, historyLoaded, isGenerating]);

  const loadingMessages = [
    "Đang quét thông tin từ các trang báo thể thao uy tín...",
    "Đang đối chiếu dữ liệu lịch sử đối đầu (H2H)...",
    "Đang kiểm tra tình hình chấn thương & treo giò...",
    "Đang tham chiếu tỷ lệ từ các nguồn uy tín...",
    "Đang tính toán số bàn thắng, thẻ phạt, phạt góc dự kiến...",
    "Đang phác thảo sơ đồ chiến thuật khả dĩ...",
    "Sắp hoàn thành bài viết nhận định chuyên sâu..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingText(loadingMessages[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const [isPinning, setIsPinning] = useState(false);

  const handlePin = async () => {
    if (!matchInfo || !predictionData || isPinning) return;
    setIsPinning(true);
    try {
      const res = await fetch('/api/generate-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pin',
          matchId,
          predictionData,
          matchData: matchInfo
        })
      });
      const data = await res.json();
      if (data.success && data.history) {
        setPredictionHistory(data.history);
        // Alert or visually highlight that it has been pinned successfully
      }
    } catch (err) {
      console.error("Lỗi khi ghim nhận định:", err);
    } finally {
      setIsPinning(false);
    }
  };

  const handleGenerateInternal = async (previewOnly: boolean = false, milestone?: string) => {
    if (!matchInfo) return;
    setIsGenerating(true);
    setError(null);

    const query = `${matchInfo.team1.name} vs ${matchInfo.team2.name}, ${matchInfo.category}`;

    try {
      const res = await fetch('/api/generate-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: query, matchData: matchInfo, previewOnly, milestone })
      });
      if (!res.ok) {
        let errorMsg = "Lỗi khi tạo nhận định";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await res.json();
            errorMsg = errData.error || errorMsg;
          } else {
            errorMsg = `${errorMsg} (Mã lỗi: ${res.status})`;
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }
      if (!res.headers.get("content-type")?.includes("application/json")) {
        throw new Error("Phản hồi từ máy chủ không hợp lệ (Không phải định dạng JSON)");
      }
      const data = await res.json();

      if (data.predictionData) {
        setPredictionData(data.predictionData);
        setIsDataPreview(previewOnly);
        if (data.history && !previewOnly) {
          setPredictionHistory(data.history);
        }
      } else {
        throw new Error("Dữ liệu trả về từ AI không đúng định dạng mong đợi");
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => handleGenerateInternal(false);
  const handleGeneratePreview = () => handleGenerateInternal(true);

  if (loadingMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && !matchInfo) {
    return (
      <div 
        className="w-full bg-[#f3f4f6] bg-no-repeat relative pt-0 md:pt-[40px] pb-10" 
        style={{ 
          backgroundImage: "url('/bg-ads-full.png')", 
          backgroundSize: "cover", 
          backgroundPosition: "top center",
          backgroundAttachment: "fixed"
        }}
      >
        <main className="max-w-[1160px] mx-auto px-4 py-16 bg-white relative z-20 shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-xl border border-slate-200 min-h-screen flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-6 drop-shadow-sm" />
          <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-wider">Lỗi Truy Xuất Dữ Liệu</h2>
          <p className="text-[14px] text-slate-500 mb-8 max-w-md font-semibold leading-relaxed">{error}</p>
          <Link href="/du-doan" className="inline-flex items-center text-[12px] font-black text-white bg-slate-900 hover:bg-slate-800 px-6 py-2.5 rounded shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </main>
      </div>
    );
  }

  const mockPost = {
    title: `Nhận định: ${matchInfo.team1.name} vs ${matchInfo.team2.name}`,
    createdAt: new Date().toISOString(),
    excerpt: `Siêu máy tính AI của ANV Sport phân tích chuyên sâu dữ liệu trận ${matchInfo.team1.name} - ${matchInfo.team2.name} thuộc ${matchInfo.category}.`,
    content: predictionData?.analysisHtml || "",
    author: "ANV Sport AI",
    imageUrl: ""
  };

  const statusLower = (matchInfo.status || '').toLowerCase();
  const isFinished = statusLower === 'ft' || 
                     statusLower === 'aet' || 
                     statusLower === 'pen' || 
                     statusLower === 'finished' || 
                     statusLower.includes('kết thúc') ||
                     statusLower.includes('đã kết thúc');

  const isLive = !isFinished && 
                 statusLower !== 'chưa diễn ra' && 
                 statusLower !== 'upcoming' && 
                 statusLower !== 'ns' && 
                 statusLower !== 'tbd' &&
                 statusLower !== 'chưa đá' &&
                 !statusLower.includes('chưa đá') &&
                 !statusLower.includes('scheduled') &&
                 !statusLower.includes('chưa bắt đầu') &&
                 !statusLower.includes('chưa diễn ra');

  const parseMatchDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const categoryLower = matchInfo.category?.toLowerCase() || '';
  const roundLower = matchInfo.round?.toLowerCase() || '';
  const isNeutral = categoryLower.includes('world cup') || 
                    categoryLower.includes('fifa') || 
                    categoryLower.includes('friendly') || 
                    categoryLower.includes('giao hữu') || 
                    categoryLower.includes('euro') || 
                    categoryLower.includes('copa america') || 
                    categoryLower.includes('afcon') || 
                    categoryLower.includes('asian cup') ||
                    roundLower.includes('chung kết') ||
                    roundLower.includes('final') ||
                    roundLower.includes('play-off') ||
                    roundLower.includes('play-off');

  const renderTeamEventsSummary = (teamName: string, isAlignRight: boolean) => {
    if (!matchInfo) return null;
    const playerGoals: Record<string, string[]> = {};
    const playerRedCards: Record<string, string[]> = {};

    if (matchInfo.events && matchInfo.events.length > 0) {
      matchInfo.events.forEach((evt: any) => {
        if (!evt.team || evt.team.name !== teamName) return;
        const playerName = evt.player?.name || "Cầu thủ";
        const elapsed = evt.time?.elapsed;
        const timeStr = elapsed ? `${elapsed}'` : "";

        if (evt.type === "Goal") {
          if (!playerGoals[playerName]) {
            playerGoals[playerName] = [];
          }
          const suffix = evt.detail === "Penalty" ? " (P)" : (evt.detail === "Own Goal" ? " (OG)" : "");
          if (timeStr) playerGoals[playerName].push(`${timeStr}${suffix}`);
        } else if (evt.type === "Card" && evt.detail?.toLowerCase().includes("red")) {
          if (!playerRedCards[playerName]) {
            playerRedCards[playerName] = [];
          }
          if (timeStr) playerRedCards[playerName].push(timeStr);
        }
      });
    } else {
      const goalsStr = teamName === matchInfo.team1.name ? matchInfo.goals?.home : matchInfo.goals?.away;
      if (goalsStr) {
        const cleanStr = goalsStr.replace(/NaN'/g, "90+'");
        const parts = cleanStr.split(';').map((s: string) => s.trim()).filter(Boolean);
        parts.forEach((part: string) => {
          const lastSpaceIndex = part.lastIndexOf(' ');
          if (lastSpaceIndex !== -1) {
            const name = part.substring(0, lastSpaceIndex).trim();
            const minute = part.substring(lastSpaceIndex + 1).trim();
            if (!playerGoals[name]) {
              playerGoals[name] = [];
            }
            playerGoals[name].push(minute);
          } else {
            if (!playerGoals[part]) {
              playerGoals[part] = [];
            }
          }
        });
      }
    }

    const items: React.ReactNode[] = [];

    Object.entries(playerGoals).forEach(([player, minutes]) => {
      items.push(
        <span key={`goal-${player}`} className="flex items-center gap-1.5 text-[12px] leading-tight text-slate-300">
          {!isAlignRight && <span className="text-[10px]">⚽</span>}
          <span className="font-bold">{player}</span>
          <span className="text-slate-400 font-semibold">{minutes.join(', ')}</span>
          {isAlignRight && <span className="text-[10px]">⚽</span>}
        </span>
      );
    });

    Object.entries(playerRedCards).forEach(([player, minutes]) => {
      items.push(
        <span key={`red-${player}`} className="flex items-center gap-1.5 text-[12px] leading-tight text-slate-300">
          {!isAlignRight && <span className="text-[10px] flex items-center justify-center w-2 h-2.5 bg-red-500 rounded-[1px] border border-red-600 shadow-[0_1px_1px_rgba(0,0,0,0.15)] flex-shrink-0"></span>}
          <span className="font-bold text-red-400">{player}</span>
          <span className="text-red-400 font-semibold">{minutes.join(', ')}</span>
          {isAlignRight && <span className="text-[10px] flex items-center justify-center w-2 h-2.5 bg-red-500 rounded-[1px] border border-red-600 shadow-[0_1px_1px_rgba(0,0,0,0.15)] flex-shrink-0"></span>}
        </span>
      );
    });

    if (items.length === 0) return null;

    return (
      <div className={`flex flex-col gap-1.5 ${isAlignRight ? 'items-end' : 'items-start'}`}>
        {items}
      </div>
    );
  };

  const hasGoalsOrRedCards = (matchInfo.goals?.home || matchInfo.goals?.away) || 
                             (matchInfo.events && matchInfo.events.some((e: any) => e.type === "Card" && e.detail?.toLowerCase().includes("red")));

  return (
    <div 
      className="w-full bg-[#f3f4f6] bg-no-repeat relative pt-0 md:pt-[40px] pb-10" 
      style={{ 
        backgroundImage: "url('/bg-ads-full.png')", 
        backgroundSize: "cover", 
        backgroundPosition: "top center",
        backgroundAttachment: "fixed"
      }}
    >
      <main className="w-full max-w-[1000px] mx-auto bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden font-client-ui relative z-20">
        
        {/* TOP NAVIGATION / HEADER (ANV Sport White Style) */}
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between text-slate-500 text-[13px] border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Link href="/du-doan" className="hover:text-green-600 transition-colors flex items-center gap-1.5 font-bold uppercase tracking-widest text-[11px]">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{matchInfo.category}</span>
              {matchInfo.round && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-bold bg-slate-200/60 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider">{matchInfo.round}</span>
                </>
              )}
            </div>
          </div>
          <span className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${
            isFinished 
              ? 'bg-slate-200 text-slate-600' 
              : isLive 
                ? 'bg-red-100 text-red-700 animate-pulse font-extrabold' 
                : 'bg-green-100 text-green-700'
          }`}>
            {isFinished ? 'Kết thúc' : isLive ? (matchInfo.livePeriod && matchInfo.liveClock ? `${matchInfo.livePeriod} - ${matchInfo.liveClock}` : (matchInfo.status || 'Đang đá')) : 'Chưa đá'}
          </span>
        </div>

        {/* MATCH INFO STRIP */}
        <div className="bg-white border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[12px] font-bold text-slate-500 uppercase tracking-widest shadow-sm relative z-10">
           <span className="flex items-center gap-1.5 text-slate-700">
             <Calendar className="w-4 h-4 text-green-600"/> 
             {parseMatchDate(matchInfo.matchDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
           </span>
           <span className="flex items-center gap-1.5 text-slate-700">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
             {matchInfo.matchTime}
           </span>
           {matchInfo.ground && matchInfo.ground !== "Chưa xác định" && (
             <span className="flex items-center gap-1.5 text-slate-700">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
               🏟 {matchInfo.ground}
             </span>
           )}
        </div>

        {/* MAIN SCOREBOARD - HORIZONTAL ANV SPORT STYLE */}
        <div className="px-4 md:px-6 py-6 md:py-8 grid grid-cols-3 items-center justify-between border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white gap-2 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
          {/* Team 1 */}
          <div className="flex flex-col items-center text-center min-w-0">
            <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center mb-2 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
              <img src={matchInfo.team1.logo} alt={matchInfo.team1.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="text-[13px] md:text-xl font-black text-white mb-1 leading-tight truncate w-full" title={matchInfo.team1.name}>{matchInfo.team1.name}</h2>
            {!isNeutral && (
              <span className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-slate-800/85 px-2.5 py-0.5 rounded-full border border-slate-700/50">Đội nhà</span>
            )}
          </div>
          
          {/* Score */}
          <div className="flex flex-col items-center justify-center min-w-0">
             {matchInfo.score1 !== null && matchInfo.score1 !== undefined ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="flex items-center justify-center gap-3 md:gap-8">
                    <span className={`text-3xl md:text-5xl font-black tracking-tight ${isFinished && matchInfo.score1 > matchInfo.score2 ? 'text-green-400' : 'text-white'}`}>{matchInfo.score1}</span>
                    <span className="text-xl md:text-3xl text-slate-600 font-light">-</span>
                    <span className={`text-3xl md:text-5xl font-black tracking-tight ${isFinished && matchInfo.score2 > matchInfo.score1 ? 'text-green-400' : 'text-white'}`}>{matchInfo.score2}</span>
                  </div>
                  {isLive && matchInfo.liveClock && (
                    <div className="mt-2.5 text-[8px] md:text-[11px] font-black text-red-500 bg-red-950/40 border border-red-500/20 rounded-full px-2 py-0.5 md:px-3 md:py-1 flex items-center gap-1 shadow-sm animate-pulse tracking-wide uppercase">
                      <span className="w-1 h-1 rounded-full bg-red-500 animate-ping shrink-0"></span>
                      <span className="truncate">{matchInfo.livePeriod} {matchInfo.liveClock}</span>
                    </div>
                  )}
                  {matchInfo.penScore1 !== undefined && matchInfo.penScore1 !== null && matchInfo.penScore2 !== undefined && matchInfo.penScore2 !== null && (
                    <div className="mt-1.5 text-[8px] md:text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30 uppercase tracking-wider text-center">
                      Luân lưu: {matchInfo.penScore1}-{matchInfo.penScore2}
                    </div>
                  )}
                </div>
             ) : (
                <div className="text-2xl md:text-4xl text-slate-600 font-black px-4 py-2 italic text-center">VS</div>
             )}
          </div>
          
          {/* Team 2 */}
          <div className="flex flex-col items-center text-center min-w-0">
            <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center mb-2 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)]">
              <img src={matchInfo.team2.logo} alt={matchInfo.team2.name} className="w-full h-full object-contain" />
            </div>
            <h2 className="text-[13px] md:text-xl font-black text-white mb-1 leading-tight truncate w-full" title={matchInfo.team2.name}>{matchInfo.team2.name}</h2>
            {!isNeutral && (
              <span className="text-slate-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest bg-slate-800/85 px-2.5 py-0.5 rounded-full border border-slate-700/50">Đội khách</span>
            )}
          </div>
        </div>

        {/* SUBHEADER - GOAL SCORERS & RED CARDS */}
        {hasGoalsOrRedCards && (
          <div className="px-8 py-4 flex items-start justify-between bg-slate-50 border-b border-slate-100">
             <div className="flex-1 text-left">
                {renderTeamEventsSummary(matchInfo.team1.name, false)}
             </div>
             <div className="mx-6 self-center"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div></div>
             <div className="flex-1 text-right">
                {renderTeamEventsSummary(matchInfo.team2.name, true)}
             </div>
          </div>
        )}

        {/* VIDEO HIGHLIGHTS CAROUSEL (White Theme) */}
        {matchInfo.video && (
          <div className="p-4 md:p-6 bg-white overflow-x-auto flex gap-4 no-scrollbar border-b border-slate-100">
             <a href={matchInfo.video} target="_blank" rel="noopener noreferrer" className="relative shrink-0 w-[240px] h-[135px] rounded border border-slate-200 overflow-hidden group shadow-sm">
               <img src={matchInfo.team1.logo} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110" />
               <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <PlayCircle className="w-12 h-12 text-white/90 group-hover:text-white transition-colors" />
               </div>
               <div className="absolute bottom-3 left-3 right-3 text-white">
                 <p className="font-bold text-[13px] leading-tight mb-0.5 drop-shadow">Tóm tắt về trận đấu</p>
                 <p className="text-[10px] text-slate-200 uppercase tracking-widest font-bold">YouTube Highlight</p>
               </div>
             </a>
             <a href={matchInfo.video} target="_blank" rel="noopener noreferrer" className="relative shrink-0 w-[240px] h-[135px] rounded border border-slate-200 overflow-hidden group shadow-sm">
               <img src={matchInfo.team2.logo} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110" />
               <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <PlayCircle className="w-12 h-12 text-white/90 group-hover:text-white transition-colors" />
               </div>
               <div className="absolute bottom-3 left-3 right-3 text-white">
                 <p className="font-bold text-[13px] leading-tight mb-0.5 drop-shadow">Diễn biến chính</p>
                 <p className="text-[10px] text-slate-200 uppercase tracking-widest font-bold">YouTube Highlight</p>
               </div>
             </a>
          </div>
        )}

        {/* TABS (Journalistic Style) */}
        <div className="flex border-b-2 border-slate-100 bg-white px-2">
          <button 
            onClick={() => setActiveTab('dienbien')}
            className={`flex-1 py-4 text-center text-[13px] font-black uppercase tracking-wider transition-colors ${activeTab === 'dienbien' ? 'text-green-600 border-b-4 border-green-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            Diễn biến
          </button>
          <button 
            onClick={() => setActiveTab('doihinh')}
            className={`flex-1 py-4 text-center text-[13px] font-black uppercase tracking-wider transition-colors ${activeTab === 'doihinh' ? 'text-green-600 border-b-4 border-green-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            Đội hình
          </button>
          <button 
            onClick={() => setActiveTab('thongke')}
            className={`flex-1 py-4 text-center text-[13px] font-black uppercase tracking-wider transition-colors ${activeTab === 'thongke' ? 'text-green-600 border-b-4 border-green-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            Thống kê
          </button>
        </div>

        {/* TAB CONTENT - THỐNG KÊ (ANV Sport Light Layout) */}
        {activeTab === 'thongke' && (
          <div className="p-4 md:p-6 bg-white min-h-[300px] border-b border-slate-100">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                 <div className="w-12">
                   <img src={matchInfo.team1.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" />
                 </div>
                 <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-widest text-center flex-1">Thống kê trận đấu</h3>
                 <div className="w-12 flex justify-end">
                   <img src={matchInfo.team2.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" />
                 </div>
              </div>

            {(isLive || isFinished) && matchInfo.statistics && matchInfo.statistics.length === 2 ? (() => {
              const statTranslations: Record<string, string> = {
                "Ball Possession": "Kiểm soát bóng",
                "Total Shots": "Tổng cú sút",
                "Shots on Goal": "Sút trúng đích",
                "Shots off Goal": "Sút chệch mục tiêu",
                "Blocked Shots": "Cú sút bị chặn",
                "Corner Kicks": "Phạt góc",
                "Offsides": "Việt vị",
                "Fouls": "Phạm lỗi",
                "Yellow Cards": "Thẻ vàng",
                "Red Cards": "Thẻ đỏ",
                "Total passes": "Tổng đường chuyền",
                "Passes accurate": "Chuyền chính xác",
                "Passes %": "Tỷ lệ chuyền chính xác",
                "Saves": "Pha cứu thua",
                "Shots": "Cú sút",
                "On Target %": "Tỷ lệ sút trúng đích",
                "Penalty Goals": "Bàn thắng phạt đền",
                "Penalty Kicks Taken": "Quả phạt đền đã sút",
                "Accurate Crosses": "Tạt bóng chính xác",
                "Crosses": "Quả tạt bóng",
                "Cross %": "Tỷ lệ tạt bóng chính xác",
                "Long Balls": "Đường chuyền dài",
                "Accurate Long Balls": "Chuyền dài chính xác",
                "Long Balls %": "Tỷ lệ chuyền dài chính xác",
                "Effective Tackles": "Tắc bóng thành công",
                "Tackles": "Pha tắc bóng",
                "Tackle %": "Tỷ lệ tắc bóng thành công",
                "Interceptions": "Đánh chặn (Cắt bóng)",
                "Effective Clearances": "Phá bóng giải nguy thành công",
                "Clearances": "Pha phá bóng giải nguy"
              };

              const importantStatsOrder = [
                "Ball Possession",
                "Total Shots",
                "Shots on Goal",
                "Corner Kicks",
                "Offsides",
                "Fouls",
                "Yellow Cards",
                "Red Cards",
                "Total passes",
                "Passes accurate",
                "Passes %"
              ];

              const t1Stats = matchInfo.statistics[0].statistics || [];
              const t2Stats = matchInfo.statistics[1].statistics || [];

              // Get all unique stat names
              const allStatNames = Array.from(new Set([
                ...t1Stats.map((s: any) => s.type),
                ...t2Stats.map((s: any) => s.type)
              ]));

              // Sort names: important first, then others
              const mainStatNames = importantStatsOrder.filter(name => allStatNames.includes(name));
              const extraStatNames = allStatNames.filter(name => !importantStatsOrder.includes(name));

              const formatStatValue = (val: any, rawType: string) => {
                if (val === null || val === undefined) return "0";
                const valStr = String(val);
                if (valStr.includes('%')) return valStr;
                const isPctType = rawType.includes('%') || rawType === "Ball Possession";
                if (isPctType) {
                  const num = parseFloat(valStr);
                  if (!isNaN(num)) {
                    const pctVal = num <= 1 ? Math.round(num * 100) : Math.round(num);
                    return `${pctVal}%`;
                  }
                }
                return valStr;
              };

              const renderStatRow = (rawType: string) => {
                const type = statTranslations[rawType] || rawType;
                
                const s1 = t1Stats.find((s: any) => s.type === rawType);
                const s2 = t2Stats.find((s: any) => s.type === rawType);
                
                const rawVal1 = s1 ? s1.value : "0";
                const rawVal2 = s2 ? s2.value : "0";

                const val1 = formatStatValue(rawVal1, rawType);
                const val2 = formatStatValue(rawVal2, rawType);

                const num1 = val1.includes('%') ? parseInt(val1.replace('%', '')) : (parseInt(val1) || 0);
                const num2 = val2.includes('%') ? parseInt(val2.replace('%', '')) : (parseInt(val2) || 0);
                
                const total = num1 + num2;
                const isPercentage = val1.includes('%') || val2.includes('%') || rawType === "Ball Possession" || rawType.includes('%');
                const w1 = total === 0 ? 0 : (isPercentage ? num1 : (num1 / total) * 100);
                const w2 = total === 0 ? 0 : (isPercentage ? num2 : (num2 / total) * 100);

                return (
                  <div key={rawType} className="flex flex-col mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-black text-[13px] w-12 text-left ${num1 >= num2 ? 'text-slate-900' : 'text-slate-500'}`}>{val1}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center flex-1">{type}</span>
                      <span className={`font-black text-[13px] w-12 text-right ${num2 >= num1 ? 'text-slate-900' : 'text-slate-500'}`}>{val2}</span>
                    </div>
                    <div className="flex w-full items-center gap-1.5">
                      <div className="flex-1 flex justify-end h-1.5 bg-slate-100 rounded-l-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${num1 >= num2 ? 'bg-blue-600' : 'bg-blue-300'}`} style={{ width: `${w1}%` }}></div>
                      </div>
                      <div className="flex-1 flex justify-start h-1.5 bg-slate-100 rounded-r-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${num2 >= num1 ? 'bg-emerald-500' : 'bg-emerald-300'}`} style={{ width: `${w2}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {mainStatNames.map(name => renderStatRow(name))}
                  
                  {showAllStats && extraStatNames.map(name => renderStatRow(name))}
                  
                  {extraStatNames.length > 0 && (
                    <div className="pt-4 flex justify-center">
                      <button
                        onClick={() => setShowAllStats(!showAllStats)}
                        className="px-6 py-2 border border-slate-200 hover:border-green-600 text-slate-600 hover:text-green-600 rounded-md font-bold text-xs uppercase tracking-wider transition-colors shadow-sm bg-white"
                      >
                        {showAllStats ? "Thu gọn số liệu" : `Xem thêm ${extraStatNames.length} số liệu khác`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <Info className="w-10 h-10 mb-3 text-slate-300" />
                 <p className="text-[13px] font-bold uppercase tracking-widest">Chưa có dữ liệu thống kê thực tế</p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* TAB CONTENT - ĐỘI HÌNH (LINEUPS) */}
        {activeTab === 'doihinh' && (
          <div className="p-4 md:p-6 bg-white min-h-[300px] border-b border-slate-100">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                 <div className="w-12">
                   <img src={matchInfo.team1.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" />
                 </div>
                 <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-widest text-center flex-1">Đội hình ra sân</h3>
                 <div className="w-12 flex justify-end">
                   <img src={matchInfo.team2.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" />
                 </div>
              </div>
              
              {/* Mobile Pitch Button (Hidden on Desktop) */}
              <div className="flex md:hidden justify-center mb-8">
                <button
                  onClick={() => setIsPitchModalOpen(true)}
                  className="flex items-center gap-2.5 bg-gradient-to-b from-[#3B823D] to-[#2C632D] hover:from-[#439645] hover:to-[#337234] text-white px-8 py-3 rounded-full font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-green-600/30 transition-all border border-green-500/30 active:scale-95 group"
                >
                  <Eye className="w-5 h-5 text-green-200 group-hover:text-white transition-colors" />
                  Xem sơ đồ chiến thuật
                </button>
              </div>
              
            {matchInfo.lineups && matchInfo.lineups.length === 2 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-3xl mx-auto relative">
                
                {/* Desktop Circular Pitch Button in the middle */}
                <div className="hidden md:flex absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <button
                    onClick={() => setIsPitchModalOpen(true)}
                    className="w-16 h-16 bg-[#3B823D] hover:bg-[#439645] rounded-full flex items-center justify-center text-white shadow-xl shadow-green-600/40 border-4 border-white hover:scale-110 active:scale-95 transition-all group"
                    title="Xem sa bàn chiến thuật"
                  >
                    {/* Mini Pitch Icon using CSS */}
                    <div className="w-6 h-8 border-2 border-white/90 rounded-[2px] relative flex flex-col justify-center items-center">
                      <div className="absolute top-1/2 w-full h-[2px] bg-white/90 -translate-y-1/2"></div>
                      <div className="w-2 h-2 rounded-full border-[2px] border-white/90 z-10 bg-[#3B823D] group-hover:bg-[#439645] transition-colors"></div>
                    </div>
                  </button>
                </div>
                 {matchInfo.lineups.map((lineup: any, i: number) => (
                   <div key={i} className="flex flex-col h-full">
                     <div className={`flex items-center w-full gap-3 mb-6 ${i === 0 ? 'justify-start' : 'justify-start flex-row-reverse'}`}>
                       <div className={`flex flex-col ${i === 0 ? 'items-start' : 'items-end'}`}>
                         <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-widest">{lineup.team.name}</h3>
                         <span className="text-[12px] font-bold text-blue-600">{lineup.formation}</span>
                       </div>
                     </div>
                     
                     <div className="mb-8">
                       <h4 className={`text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2 ${i === 0 ? 'text-left' : 'text-right'}`}>Đội Hình Xuất Phát</h4>
                       <div className="space-y-1">
                         {lineup.startXI.map((playerObj: any, idx: number) => {
                           const posMap: Record<string, string> = { "G": "GK", "D": "Hậu vệ", "M": "Tiền vệ", "F": "Tiền đạo" };
                           const summary = getPlayerEventsSummary(playerObj.player, matchInfo.events);
                           return (
                             <div key={idx} className={`flex items-center justify-between w-full py-1.5 border-b border-slate-50 last:border-0 ${i === 0 ? '' : 'flex-row-reverse'}`}>
                               <div className={`flex items-center gap-3 ${i === 0 ? '' : 'flex-row-reverse'}`}>
                                 {playerObj.player.avatar ? (
                                   <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm relative group/avatar">
                                     <img src={playerObj.player.avatar} alt={playerObj.player.name} className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                       <span className="text-[9px] text-white font-black">{playerObj.player.number}</span>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-sm">
                                     {playerObj.player.number}
                                   </div>
                                 )}
                                 <div className={`flex flex-col ${i === 0 ? 'items-start' : 'items-end'}`}>
                                   {playerObj.player.slug ? (
                                     <Link href={`/entity/${playerObj.player.slug}`} className="text-[13px] font-bold text-slate-800 hover:text-[#16A34A] transition-colors hover:underline">
                                       {playerObj.player.name}
                                     </Link>
                                   ) : (
                                     <span className="text-[13px] font-bold text-slate-800">{playerObj.player.name}</span>
                                   )}
                                   <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{posMap[playerObj.player.pos] || playerObj.player.pos}</span>
                                 </div>
                               </div>
                               <PlayerListIndicators summary={summary} isAlignRight={i === 1} />
                             </div>
                           )
                         })}
                       </div>
                     </div>

                     <div className="mb-8">
                       <h4 className={`text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2 ${i === 0 ? 'text-left' : 'text-right'}`}>Dự bị</h4>
                       <div className="space-y-1">
                         {[...lineup.substitutes]
                           .sort((a, b) => {
                             const sumA = getPlayerEventsSummary(a.player, matchInfo.events);
                             const sumB = getPlayerEventsSummary(b.player, matchInfo.events);
                             if (sumA.subbedIn && !sumB.subbedIn) return -1;
                             if (!sumA.subbedIn && sumB.subbedIn) return 1;
                             if (sumA.subbedIn && sumB.subbedIn) {
                               return (sumA.subMinute || 0) - (sumB.subMinute || 0);
                             }
                             return 0;
                           })
                           .map((playerObj: any, idx: number) => {
                             const posMap: Record<string, string> = { "G": "GK", "D": "Hậu vệ", "M": "Tiền vệ", "F": "Tiền đạo" };
                             const summary = getPlayerEventsSummary(playerObj.player, matchInfo.events);
                             return (
                               <div key={idx} className={`flex items-center justify-between w-full py-1.5 border-b border-slate-50 last:border-0 ${i === 0 ? '' : 'flex-row-reverse'}`}>
                                 <div className={`flex items-center gap-3 ${i === 0 ? '' : 'flex-row-reverse'}`}>
                                   {playerObj.player.avatar ? (
                                     <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm relative group/avatar">
                                       <img src={playerObj.player.avatar} alt={playerObj.player.name} className="w-full h-full object-cover" />
                                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                         <span className="text-[8px] text-white font-black">{playerObj.player.number}</span>
                                       </div>
                                     </div>
                                   ) : (
                                     <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 border border-slate-200">
                                       {playerObj.player.number}
                                     </div>
                                   )}
                                   <div className={`flex flex-col ${i === 0 ? 'items-start' : 'items-end'}`}>
                                     {playerObj.player.slug ? (
                                       <Link href={`/entity/${playerObj.player.slug}`} className="text-[13px] font-semibold text-slate-600 hover:text-[#16A34A] transition-colors hover:underline">
                                         {playerObj.player.name}
                                       </Link>
                                     ) : (
                                       <span className="text-[13px] font-semibold text-slate-600">{playerObj.player.name}</span>
                                     )}
                                     <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{posMap[playerObj.player.pos] || playerObj.player.pos}</span>
                                   </div>
                                 </div>
                                 <PlayerListIndicators summary={summary} isAlignRight={i === 1} />
                               </div>
                             );
                           })
                         }
                       </div>
                     </div>
                     
                     <div className="border-t border-slate-100 pt-4 mt-auto">
                       <h4 className={`text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ${i === 0 ? 'text-left' : 'text-right'}`}>Huấn Luyện Viên Trưởng</h4>
                       <div className={`flex items-center w-full ${i === 0 ? 'justify-start' : 'justify-start flex-row-reverse'}`}>
                         <span className="text-[14px] font-black text-slate-800">{lineup.coach.name}</span>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <Info className="w-10 h-10 mb-3 text-slate-300" />
                 <p className="text-[13px] font-bold uppercase tracking-widest">Chưa có dữ liệu đội hình thực tế</p>
              </div>
            )}
            
            {/* SƠ ĐỒ/CHÚ THÍCH KÝ HIỆU (Legend) */}
            {matchInfo.lineups && matchInfo.lineups.length === 2 && (
              <div className="mt-12 p-5 bg-slate-900 text-white rounded-xl shadow-inner max-w-3xl mx-auto border border-slate-850">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-3 bg-green-500 rounded-sm"></div>
                  Chú thích ký hiệu đội hình
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px] text-slate-300">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base shrink-0 w-6 text-center">⚽</span>
                      <span>Bàn thắng</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base shrink-0 w-6 text-center">⚽🔴</span>
                      <span>Bàn phản lưới nhà</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-3.5 bg-yellow-400 border border-yellow-500 rounded-[1px] inline-block shadow-sm shrink-0"></span>
                      <span className="ml-1.5">Thẻ vàng</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-3.5 bg-red-500 border border-red-600 rounded-[1px] inline-block shadow-sm shrink-0"></span>
                      <span className="ml-1.5">Thẻ đỏ</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs shrink-0 w-6 text-center">🟨🟥</span>
                      <span>2 thẻ vàng</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-green-600/20 text-green-500 flex items-center justify-center font-bold text-xs shrink-0">↑</span>
                      <span>Thay người vào sân</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center font-bold text-xs shrink-0">↓</span>
                      <span>Thay người ra sân</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded border border-slate-700 bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">✚</span>
                      <span>Chấn thương</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full border border-red-500/30 bg-red-950/20 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0">🚫</span>
                      <span>Treo giò</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base shrink-0 w-6 text-center">👟</span>
                      <span>Kiến tạo</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            </div>
          </div>
        )}

        {/* TAB CONTENT - DIỄN BIẾN (EVENTS) */}
        {activeTab === 'dienbien' && (
          <div className="p-4 md:p-6 bg-white min-h-[300px] border-b border-slate-100">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-10 pb-4 border-b border-slate-100">
                 <div className="w-12">
                   <img src={matchInfo.team1.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" />
                 </div>
                 <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-widest text-center flex-1">Diễn biến trận đấu</h3>
                 <div className="w-12 flex justify-end">
                   <img src={matchInfo.team2.logo} className="w-8 h-8 object-contain shadow-sm border border-slate-100 rounded-sm bg-white" />
                 </div>
              </div>

            {matchInfo.events && matchInfo.events.length > 0 ? (
              <div className="max-w-2xl mx-auto relative before:absolute before:inset-0 before:ml-[50%] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                 {matchInfo.events.map((event: any, idx: number) => {
                    const isHome = event.team.name === matchInfo.team1.name;
                    
                    let eventTitle = event.detail;
                    let eventSubtitle = event.player.name;
                    let extraDesc = "";
                    let borderClass = "border-slate-100";
                    
                    if (event.type === 'Goal') {
                      eventTitle = "Bàn thắng";
                      if (event.detail === 'Penalty') eventTitle = "Phạt đền (Penalty)";
                      if (event.detail === 'Own Goal') eventTitle = "Đốt lưới nhà";
                      if (event.assist?.name) extraDesc = `Kiến tạo: ${event.assist.name}`;
                      borderClass = isHome ? "border-l-4 border-l-green-500 border-t-slate-100 border-r-slate-100 border-b-slate-100" : "border-r-4 border-r-green-500 border-t-slate-100 border-l-slate-100 border-b-slate-100";
                    } else if (event.type === 'Card') {
                      if (event.detail === 'Yellow Card') {
                        eventTitle = "Thẻ vàng";
                        borderClass = isHome ? "border-l-4 border-l-yellow-400 border-t-slate-100 border-r-slate-100 border-b-slate-100" : "border-r-4 border-r-yellow-400 border-t-slate-100 border-l-slate-100 border-b-slate-100";
                      }
                      if (event.detail === 'Red Card') {
                        eventTitle = "Thẻ đỏ";
                        borderClass = isHome ? "border-l-4 border-l-red-500 border-t-slate-100 border-r-slate-100 border-b-slate-100" : "border-r-4 border-r-red-500 border-t-slate-100 border-l-slate-100 border-b-slate-100";
                      }
                    } else if (event.type === 'subst') {
                      eventTitle = "Thay người";
                      if (event.assist?.name) extraDesc = `Ra sân: ${event.assist.name}`;
                      borderClass = isHome ? "border-l-4 border-l-blue-500 border-t-slate-100 border-r-slate-100 border-b-slate-100" : "border-r-4 border-r-blue-500 border-t-slate-100 border-l-slate-100 border-b-slate-100";
                    }
                    
                    return (
                      <div key={idx} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-6`}>
                        <div className={`flex items-center justify-end w-full md:w-1/2 ${isHome ? 'md:pr-8 pr-5' : 'md:pl-8 pl-5 flex-row-reverse md:flex-row'}`}>
                          <div className={`p-3 min-w-[180px] bg-white border shadow-sm rounded-xl flex flex-col ${borderClass} ${!isHome && 'md:items-start items-end'} ${isHome && 'items-end'}`}>
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-[13px] font-bold text-slate-800">{eventSubtitle}</span>
                               {event.type === 'Goal' && <span className="text-[13px] drop-shadow-sm">⚽</span>}
                               {event.type === 'Card' && event.detail.includes('Yellow') && <div className="w-3 h-4 bg-[#facc15] rounded-[2px] shadow-sm"></div>}
                               {event.type === 'Card' && event.detail.includes('Red') && <div className="w-3 h-4 bg-[#ef4444] rounded-[2px] shadow-sm"></div>}
                               {event.type === 'subst' && <span className="text-[13px] text-blue-500">🔄</span>}
                             </div>
                             <div className="flex flex-col gap-0.5">
                               <span className="text-[11px] font-semibold text-slate-500">{eventTitle}</span>
                               {extraDesc && <span className="text-[10px] font-medium text-slate-400">{extraDesc}</span>}
                             </div>
                          </div>
                        </div>
                        <div className="w-7 h-7 absolute left-1/2 -translate-y-4 sm:translate-y-0 transform -translate-x-1/2 flex items-center justify-center">
                           <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm z-10">
                             {event.time.elapsed}'
                           </div>
                        </div>
                      </div>
                    );
                 })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <Info className="w-10 h-10 mb-3 text-slate-300" />
                 <p className="text-[13px] font-bold uppercase tracking-widest">Chưa có dữ liệu diễn biến thực tế</p>
              </div>
            )}
            </div>
          </div>
        )}
        {/* AI BUTTON */}
        {!isFinished && (
          <div className="p-4 md:p-6 bg-white text-center">
            <h3 className="text-slate-900 font-black mb-2 text-xl uppercase tracking-tighter">Báo Cáo Phân Tích Chuyên Sâu</h3>
            <p className="text-slate-500 text-[13px] font-medium mb-6 max-w-md mx-auto">
              Hệ thống tự động phân tích và đưa ra nhận định chuyên sâu theo thời gian thực.
            </p>
            
            {!isGenerating && (
              <div className="flex justify-center items-center">
                <Button 
                  onClick={handleGeneratePreview} 
                  className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded text-[13px] font-black uppercase tracking-widest shadow-md flex items-center justify-center transition-colors border border-slate-700"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Xem nhận định Real-time mới nhất
                </Button>
              </div>
            )}
            {isGenerating && (
              <div className="bg-slate-50 rounded p-6 flex flex-col items-center border border-slate-200 max-w-sm mx-auto shadow-sm">
                <div className="w-8 h-8 rounded-full border-[3px] border-green-500 border-t-transparent animate-spin mb-4"></div>
                <p className="text-green-600 text-[13px] font-bold uppercase tracking-wider">{loadingText}</p>
              </div>
            )}
          </div>
        )}

        {/* AI PREDICTION RESULTS */}
        {matchInfo && !loadingMatch && (
           <div className="border-t-4 border-green-600 bg-white">
             {/* History selector */}
             <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-1.5 h-3.5 bg-green-600 rounded-sm"></div>
                 <span className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Mốc thời gian nhận định AI</span>
               </div>
               <div className="flex flex-wrap gap-2">
                 {[
                    { key: 'PRE_MATCH', label: 'Trước trận đấu' },
                    { key: 'START_MATCH', label: 'Bắt đầu trận' },
                    { key: 'HALF_TIME', label: 'Giữa trận' },
                    { key: 'LIVE', label: 'Nhận định Real-time' }
                  ].map((tab) => {
                    const statusLower = (matchInfo.status || '').toLowerCase();
                    const isFinished = statusLower === 'ft' || 
                                       statusLower === 'aet' || 
                                       statusLower === 'pen' || 
                                       statusLower === 'finished' || 
                                       statusLower.includes('kết thúc') ||
                                       statusLower.includes('đã kết thúc');

                    const isLive = !isFinished && 
                                   statusLower !== 'chưa diễn ra' && 
                                   statusLower !== 'upcoming' && 
                                   statusLower !== 'ns' && 
                                   statusLower !== 'tbd' &&
                                   statusLower !== 'chưa đá' &&
                                   !statusLower.includes('chưa đá') &&
                                   !statusLower.includes('scheduled') &&
                                   !statusLower.includes('chưa bắt đầu') &&
                                   !statusLower.includes('chưa diễn ra');

                    const livePeriodLower = (matchInfo.livePeriod || '').toLowerCase();
                    const isSecondHalf = isLive && (
                      statusLower.includes('2nd half') || 
                      statusLower.includes('hiệp 2') || 
                      livePeriodLower.includes('2nd') || 
                      livePeriodLower.includes('hiệp 2')
                    );

                    let isPastStartTime = false;
                    if (matchInfo.matchDate && matchInfo.matchTime) {
                      try {
                        let datePart = matchInfo.matchDate;
                        if (datePart.includes('/')) {
                          const parts = datePart.split('/');
                          datePart = parts[2] + '-' + parts[1].padStart(2, '0') + '-' + parts[0].padStart(2, '0');
                        }
                        const scheduledDate = new Date(datePart + 'T' + matchInfo.matchTime + ':00');
                        if (!isNaN(scheduledDate.getTime()) && Date.now() >= scheduledDate.getTime()) {
                          isPastStartTime = true;
                        }
                      } catch (e) {}
                    }

                    let isAvailable = false;
                    if (tab.key === 'PRE_MATCH') {
                      isAvailable = true;
                    } else if (tab.key === 'START_MATCH') {
                      isAvailable = isLive || isFinished || isPastStartTime;
                    } else if (tab.key === 'HALF_TIME') {
                      isAvailable = isSecondHalf || isFinished;
                    } else if (tab.key === 'LIVE') {
                      isAvailable = isLive || isFinished || isPastStartTime;
                    }

                    const isSelected = selectedMilestone === tab.key;
                    const histItem = tab.key === 'LIVE' ? null : predictionHistory.find(h => h.milestone === tab.key);
                    const hasData = isAvailable && (!!histItem || (tab.key === 'LIVE' && isDataPreview && predictionData));

                    return (
                      <button
                        key={tab.key}
                        disabled={!isAvailable}
                        onClick={() => {
                          if (!isAvailable) return;
                          setSelectedMilestone(tab.key as any);
                          if (tab.key === 'LIVE' && isDataPreview && predictionData) {
                            // Keep showing preview
                          } else if (histItem) {
                            setPredictionData(histItem.prediction);
                            setIsDataPreview(false);
                          } else {
                            // Reset preview if no data
                          }
                        }}
                        className={`px-4 py-2 rounded text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm
                          ${isSelected 
                            ? 'bg-green-600 border-green-600 text-white' 
                            : isAvailable 
                              ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
                              : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'}
                          ${!hasData ? 'opacity-60' : ''}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                        <span>{tab.label}</span>
                        {!hasData && <span className="text-[9px] text-slate-400 font-semibold italic">(Chưa có)</span>}
                      </button>
                    );
                  })}
               </div>
             </div>

             {(() => {
               const histItem = predictionHistory.find(h => h.milestone === selectedMilestone);
               const showPreview = isDataPreview && selectedMilestone === 'LIVE';
               const basePrediction = showPreview ? predictionData : (histItem?.prediction || null);

               let activePrediction = null;
               if (basePrediction && matchInfo) {
                 const prob = getWinProbability(matchInfo.id, matchInfo.team1.name, matchInfo.team2.name);
                 activePrediction = {
                   ...basePrediction,
                   header: {
                     ...basePrediction.header,
                     team1: {
                       name: matchInfo.team1.name,
                       logo: matchInfo.team1.logo
                     },
                     team2: {
                       name: matchInfo.team2.name,
                       logo: matchInfo.team2.logo
                     },
                     matchTime: `${matchInfo.matchTime || ''}, ${matchInfo.matchDate || ''}`,
                     tournament: matchInfo.category || basePrediction.header?.tournament,
                     probabilities: { team1: prob.w1, draw: prob.draw, team2: prob.w2 }
                   }
                 };
               }

               if (isGenerating) {
                 return (
                   <div className="bg-slate-50 p-12 flex flex-col items-center justify-center text-center">
                     <div className="w-8 h-8 rounded-full border-[3px] border-green-500 border-t-transparent animate-spin mb-4"></div>
                     <p className="text-green-600 text-[13px] font-bold uppercase tracking-wider">{loadingText}</p>
                   </div>
                 );
               }

               return (
                  <>
                    <div className="bg-green-50/50 border-b border-green-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-6">
                      <p className="text-green-800 font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                        <Bot className="w-4 h-4" /> Báo cáo phân tích AI đã sẵn sàng
                      </p>
                      {activePrediction && (
                        <Button
                          onClick={handlePin}
                          disabled={isPinning}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] uppercase tracking-wider py-1.5 px-4 rounded shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          📌 {isPinning ? "Đang ghim..." : "Ghim nhận định này"}
                        </Button>
                      )}
                    </div>
                    
                    {activePrediction ? (
                      <div className="p-4 md:p-6">
                        <PredictionView post={mockPost} predictionData={activePrediction} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 m-6">
                         <Bot className="w-12 h-12 mb-4 text-slate-300 animate-bounce" />
                         <h4 className="text-base font-bold text-slate-800 mb-2 uppercase tracking-wide">Chưa có dữ liệu nhận định</h4>
                         <p className="text-xs text-slate-500 max-w-sm text-center font-medium leading-relaxed">
                           {selectedMilestone === 'START_MATCH' 
                             ? 'Nhận định Đầu trận sẽ tự động cập nhật khi trận đấu bắt đầu diễn ra (Trọng tài thổi còi khai cuộc Hiệp 1).' 
                             : selectedMilestone === 'HALF_TIME'
                               ? 'Nhận định Giữa trận sẽ tự động cập nhật khi trận đấu bắt đầu Hiệp 2.'
                               : selectedMilestone === 'LIVE'
                                 ? 'Nhận định Real-time chưa được tạo. Hãy nhấn nút "Xem nhận định Real-time mới nhất" phía trên để tạo phân tích trực tiếp mới nhất.'
                                 : 'Chưa có dữ liệu nhận định từ hệ thống cho mốc thời gian này.'}
                         </p>
                      </div>
                    )}
                  </>
                );
              })()}
           </div>
        )}
      </main>

      {/* Pitch Modal */}
      {isPitchModalOpen && matchInfo?.lineups && matchInfo.lineups.length === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsPitchModalOpen(false)}></div>
          <div className="relative w-full max-w-[600px] bg-slate-950 sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-800 flex flex-col max-h-[100vh] sm:max-h-[90vh]">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 relative z-10 flex-shrink-0">
              <h3 className="text-white font-black uppercase tracking-widest text-[12px] sm:text-[14px] flex items-center gap-2">
                <div className="w-1.5 h-3.5 bg-green-500 rounded-sm"></div>
                Sơ đồ chiến thuật
              </h3>
              <button onClick={() => setIsPitchModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-950 p-2 sm:p-4">
              <PitchLineup team1={matchInfo.lineups[0]} team2={matchInfo.lineups[1]} formationsData={formationsData} events={matchInfo.events} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
