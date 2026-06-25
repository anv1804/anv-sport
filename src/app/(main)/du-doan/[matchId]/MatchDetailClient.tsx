"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { type PredictionData } from '@/components/domain/article/PredictionView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import MatchHeader from './_components/MatchHeader';
import ScoreBoard from './_components/ScoreBoard';
import WinProbabilityBar from './_components/WinProbabilityBar';
import EventsSummaryStrip from './_components/EventsSummaryStrip';
import VideoCarousel from './_components/VideoCarousel';
import MatchTabs, { type TabKey } from './_components/MatchTabs';
import StatsTab from './_components/StatsTab';
import LineupTab from './_components/LineupTab';
import EventsTab from './_components/EventsTab';
import AiSection from './_components/AiSection';
import PitchModal from './_components/PitchModal';
import {
  type MatchInfo, type MilestoneKey, type PredictionHistoryItem,
  parseMatchStatus, checkPastStartTime, getMilestoneAvailability,
} from './_components/helpers';

const LOADING_MESSAGES = [
  'Đang quét thông tin từ các trang báo thể thao uy tín...',
  'Đang đối chiếu dữ liệu lịch sử đối đầu (H2H)...',
  'Đang kiểm tra tình hình chấn thương & treo giò...',
  'Đang tham chiếu tỷ lệ từ các nguồn uy tín...',
  'Đang tính toán số bàn thắng, thẻ phạt, phạt góc dự kiến...',
  'Đang phác thảo sơ đồ chiến thuật khả dĩ...',
  'Sắp hoàn thành bài viết nhận định chuyên sâu...',
];

export default function MatchDetailClient({ matchId }: { matchId: string }) {
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [formationsData, setFormationsData] = useState<any>(null);
  const [isPitchModalOpen, setIsPitchModalOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryItem[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDataPreview, setIsDataPreview] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>('thongke');
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneKey>('PRE_MATCH');
  const [attemptedMilestones, setAttemptedMilestones] = useState<Record<string, boolean>>({});

  const handleGenerateInternal = useCallback(async (previewOnly = false, milestone?: string) => {
    if (!matchInfo) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const res = await fetch('/api/generate-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${matchInfo.team1.name} vs ${matchInfo.team2.name}, ${matchInfo.category}`,
          matchData: matchInfo, previewOnly, milestone,
        }),
      });
      if (!res.ok) {
        let msg = `Lỗi khi tạo nhận định (Mã lỗi: ${res.status})`;
        try {
          if (res.headers.get('content-type')?.includes('application/json')) {
            msg = (await res.json()).error || msg;
          }
        } catch {}
        throw new Error(msg);
      }
      if (!res.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Phản hồi từ máy chủ không hợp lệ (Không phải định dạng JSON)');
      }
      const data = await res.json();
      if (!data.predictionData) throw new Error('Dữ liệu trả về từ AI không đúng định dạng mong đợi');
      setPredictionData(data.predictionData);
      setIsDataPreview(previewOnly);
      if (data.history && !previewOnly) setPredictionHistory(data.history);
    } catch (err: unknown) {
      setGenerationError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsGenerating(false);
    }
  }, [matchInfo]);

  const handlePin = async () => {
    if (!matchInfo || !predictionData || isPinning) return;
    setIsPinning(true);
    try {
      const res = await fetch('/api/generate-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin', matchId, predictionData, matchData: matchInfo }),
      });
      const data = await res.json();
      if (data.success && data.history) setPredictionHistory(data.history);
    } catch (err) {
      console.error('Lỗi khi ghim nhận định:', err);
    } finally {
      setIsPinning(false);
    }
  };

  const handleSelectMilestone = (key: MilestoneKey) => {
    setSelectedMilestone(key);
    if (key !== 'LIVE') setIsDataPreview(false);
  };

  // Formations data
  useEffect(() => {
    fetch('/api/formations')
      .then(res => res.ok && res.headers.get('content-type')?.includes('application/json') ? res.json() : { success: false })
      .then(data => { if (data.success) setFormationsData(data.data); })
      .catch(err => console.error('Error fetching formations:', err));
  }, []);

  // Prediction history
  useEffect(() => {
    if (!matchId) return;
    const load = async () => {
      try {
        const res = await fetch('/api/generate-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ historyOnly: true, matchId }),
        });
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return;
        const data = await res.json();
        if (data.success && data.history) {
          setPredictionHistory(data.history);
          if (data.history.length > 0) {
            const m = data.history[0].milestone;
            if (['PRE_MATCH', 'START_MATCH', 'HALF_TIME'].includes(m)) {
              setSelectedMilestone(m as MilestoneKey);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử nhận định', err);
      } finally {
        setHistoryLoaded(true);
      }
    };
    load();
  }, [matchId]);

  // Match data with live polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/fixtures?id=${matchId}`);
        if (!res.ok) {
          setMatchError(`Lỗi kết nối máy chủ API lịch thi đấu (Mã lỗi: ${res.status})`);
          setLoadingMatch(false);
          return;
        }
        if (!res.headers.get('content-type')?.includes('application/json')) {
          setMatchError('Không tải được dữ liệu trận đấu (Phản hồi không phải JSON)');
          setLoadingMatch(false);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setMatchInfo(data.data);
          const { isLive } = parseMatchStatus(data.data);
          if (isLive && !intervalId) intervalId = setInterval(fetchMatch, 10000);
        } else {
          setMatchError(data.error || 'Không tìm thấy thông tin trận đấu này.');
        }
      } catch {
        setMatchError('Lỗi kết nối máy chủ API lịch thi đấu');
      } finally {
        setLoadingMatch(false);
      }
    };
    fetchMatch();
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [matchId]);

  // Derive a validated milestone — never triggers a re-render cascade
  const activeMilestone = useMemo<MilestoneKey>(() => {
    if (!matchInfo) return selectedMilestone;
    const { isFinished, isLive, isSecondHalf } = parseMatchStatus(matchInfo);
    const isPastStart = checkPastStartTime(matchInfo);
    return getMilestoneAvailability(selectedMilestone, isFinished, isLive, isSecondHalf, isPastStart)
      ? selectedMilestone
      : 'PRE_MATCH';
  }, [matchInfo, selectedMilestone]);

  // Auto-generation based on match state
  useEffect(() => {
    if (!matchInfo || loadingMatch || !historyLoaded || isGenerating) return;
    const { isFinished, isLive, isSecondHalf } = parseMatchStatus(matchInfo);
    const isPastStart = checkPastStartTime(matchInfo);
    const has = (m: string) => predictionHistory.some(h => h.milestone === m);

    const run = async () => {
      if (!has('PRE_MATCH') && !attemptedMilestones.PRE_MATCH) {
        setAttemptedMilestones(p => ({ ...p, PRE_MATCH: true }));
        setLoadingText('Siêu máy tính đang tạo nhận định Trước trận...');
        await handleGenerateInternal(false, 'PRE_MATCH');
        return;
      }
      if ((isLive || isFinished || isPastStart) && !has('START_MATCH') && !attemptedMilestones.START_MATCH) {
        setAttemptedMilestones(p => ({ ...p, START_MATCH: true }));
        setLoadingText('Siêu máy tính đang tạo nhận định Đầu trận...');
        await handleGenerateInternal(false, 'START_MATCH');
        return;
      }
      if ((isSecondHalf || isFinished) && !has('HALF_TIME') && !attemptedMilestones.HALF_TIME) {
        setAttemptedMilestones(p => ({ ...p, HALF_TIME: true }));
        setLoadingText('Siêu máy tính đang tạo nhận định Giữa trận...');
        await handleGenerateInternal(false, 'HALF_TIME');
        return;
      }
      if (predictionHistory.length === 0 && !attemptedMilestones.fallback) {
        setAttemptedMilestones(p => ({ ...p, fallback: true }));
        setLoadingText('Siêu máy tính đang tự động phân tích diễn biến trận đấu trực tiếp...');
        await handleGenerateInternal(true);
      }
    };
    run();
  }, [matchInfo, predictionHistory, loadingMatch, historyLoaded, isGenerating, attemptedMilestones, handleGenerateInternal]);

  // Loading text rotation while generating
  useEffect(() => {
    if (!isGenerating) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingText(LOADING_MESSAGES[i]);
    }, 2500);
    return () => clearInterval(id);
  }, [isGenerating]);

  if (loadingMatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (matchError && !matchInfo) {
    return (
      <div className="w-full bg-[#f3f4f6] bg-no-repeat relative pt-0 md:pt-[40px] pb-10" style={{ backgroundImage: "url('/bg-ads-full.png')", backgroundSize: 'cover', backgroundPosition: 'top center', backgroundAttachment: 'fixed' }}>
        <main className="max-w-[1160px] mx-auto px-4 py-16 bg-white relative z-20 shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-xl border border-slate-200 min-h-screen flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mb-6 drop-shadow-sm" />
          <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-wider">Lỗi Truy Xuất Dữ Liệu</h2>
          <p className="text-[14px] text-slate-500 mb-8 max-w-md font-semibold leading-relaxed">{matchError}</p>
          <Link href="/du-doan" className="inline-flex items-center text-[12px] font-black text-white bg-slate-900 hover:bg-slate-800 px-6 py-2.5 rounded shadow-sm transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </main>
      </div>
    );
  }

  if (!matchInfo) return null;

  const { isFinished, isLive, isSecondHalf } = parseMatchStatus(matchInfo);
  const isPastStart = checkPastStartTime(matchInfo);
  const hasGoalsOrCards =
    !!(matchInfo.goals?.home || matchInfo.goals?.away) ||
    matchInfo.events?.some((e: any) => e.type === 'Card' && e.detail?.toLowerCase().includes('red'));

  return (
    <div className="w-full bg-[#f3f4f6] bg-no-repeat relative pt-0 md:pt-[40px] pb-10" style={{ backgroundImage: "url('/bg-ads-full.png')", backgroundSize: 'cover', backgroundPosition: 'top center', backgroundAttachment: 'fixed' }}>
      <main className="w-full max-w-[1000px] mx-auto bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden font-client-ui relative z-20">

        <MatchHeader matchInfo={matchInfo} isFinished={isFinished} isLive={isLive} />
        <ScoreBoard matchInfo={matchInfo} isFinished={isFinished} isLive={isLive} />
        <WinProbabilityBar matchInfo={matchInfo} />

        {hasGoalsOrCards && <EventsSummaryStrip matchInfo={matchInfo} />}
        <VideoCarousel matchInfo={matchInfo} />

        <MatchTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'thongke' && <StatsTab matchInfo={matchInfo} isLive={isLive} isFinished={isFinished} />}
        {activeTab === 'doihinh' && <LineupTab matchInfo={matchInfo} onOpenPitch={() => setIsPitchModalOpen(true)} />}
        {activeTab === 'dienbien' && <EventsTab matchInfo={matchInfo} />}

        <AiSection
          matchInfo={matchInfo}
          isFinished={isFinished}
          isLive={isLive}
          isSecondHalf={isSecondHalf}
          isPastStartTime={isPastStart}
          isGenerating={isGenerating}
          loadingText={loadingText}
          predictionData={predictionData}
          predictionHistory={predictionHistory}
          selectedMilestone={activeMilestone}
          isDataPreview={isDataPreview}
          isPinning={isPinning}
          generationError={generationError}
          onGeneratePreview={() => handleGenerateInternal(true)}
          onPin={handlePin}
          onSelectMilestone={handleSelectMilestone}
        />
      </main>

      {isPitchModalOpen && matchInfo.lineups?.length === 2 && (
        <PitchModal
          isOpen={isPitchModalOpen}
          onClose={() => setIsPitchModalOpen(false)}
          lineups={matchInfo.lineups}
          events={matchInfo.events || []}
          formationsData={formationsData}
        />
      )}
    </div>
  );
}
