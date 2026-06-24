import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PredictionView, type PredictionData } from '@/components/domain/article/PredictionView';
import { getWinProbability } from '@/lib/utils';
import {
  type MatchInfo, type MilestoneKey, type PredictionHistoryItem,
  getMilestoneAvailability,
} from './helpers';

const MILESTONES: { key: MilestoneKey; label: string }[] = [
  { key: 'PRE_MATCH', label: 'Trước trận đấu' },
  { key: 'START_MATCH', label: 'Bắt đầu trận' },
  { key: 'HALF_TIME', label: 'Giữa trận' },
  { key: 'LIVE', label: 'Nhận định Real-time' },
];

interface Props {
  matchInfo: MatchInfo;
  isFinished: boolean;
  isLive: boolean;
  isSecondHalf: boolean;
  isPastStartTime: boolean;
  isGenerating: boolean;
  loadingText: string;
  predictionData: PredictionData | null;
  predictionHistory: PredictionHistoryItem[];
  selectedMilestone: MilestoneKey;
  isDataPreview: boolean;
  isPinning: boolean;
  generationError: string | null;
  onGeneratePreview: () => void;
  onPin: () => void;
  onSelectMilestone: (key: MilestoneKey) => void;
}

export default function AiSection({
  matchInfo, isFinished, isLive, isSecondHalf, isPastStartTime,
  isGenerating, loadingText, predictionData, predictionHistory,
  selectedMilestone, isDataPreview, isPinning, generationError,
  onGeneratePreview, onPin, onSelectMilestone,
}: Props) {
  const mockPost = {
    title: `Nhận định: ${matchInfo.team1.name} vs ${matchInfo.team2.name}`,
    createdAt: new Date().toISOString(),
    excerpt: `Siêu máy tính AI của ANV Sport phân tích chuyên sâu trận ${matchInfo.team1.name} - ${matchInfo.team2.name} thuộc ${matchInfo.category}.`,
    content: predictionData?.analysisHtml || '',
    author: 'ANV Sport AI',
    imageUrl: '',
  };

  const histItem = predictionHistory.find(h => h.milestone === selectedMilestone);
  const showPreview = isDataPreview && selectedMilestone === 'LIVE';
  const basePrediction = showPreview ? predictionData : (histItem?.prediction ?? null);

  let activePrediction = null;
  if (basePrediction) {
    const prob = getWinProbability(matchInfo.id, matchInfo.team1.name, matchInfo.team2.name);
    activePrediction = {
      ...basePrediction,
      header: {
        ...basePrediction.header,
        team1: { name: matchInfo.team1.name, logo: matchInfo.team1.logo },
        team2: { name: matchInfo.team2.name, logo: matchInfo.team2.logo },
        matchTime: `${matchInfo.matchTime || ''}, ${matchInfo.matchDate || ''}`,
        tournament: matchInfo.category || basePrediction.header?.tournament,
        probabilities: { team1: prob.w1, draw: prob.draw, team2: prob.w2 },
      },
    };
  }

  return (
    <>
      {!isFinished && (
        <div className="p-4 md:p-6 bg-white text-center">
          <h3 className="text-slate-900 font-black mb-2 text-xl uppercase tracking-tighter">Báo Cáo Phân Tích Chuyên Sâu</h3>
          <p className="text-slate-500 text-[13px] font-medium mb-6 max-w-md mx-auto">
            Hệ thống tự động phân tích và đưa ra nhận định chuyên sâu theo thời gian thực.
          </p>
          {!isGenerating ? (
            <div className="flex justify-center items-center">
              <Button
                onClick={onGeneratePreview}
                className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded text-[13px] font-black uppercase tracking-widest shadow-md flex items-center justify-center transition-colors border border-slate-700"
              >
                <Bot className="w-4 h-4 mr-2" />
                Xem nhận định Real-time mới nhất
              </Button>
            </div>
          ) : (
            <div className="bg-slate-50 rounded p-6 flex flex-col items-center border border-slate-200 max-w-sm mx-auto shadow-sm">
              <div className="w-8 h-8 rounded-full border-[3px] border-green-500 border-t-transparent animate-spin mb-4" />
              <p className="text-green-600 text-[13px] font-bold uppercase tracking-wider">{loadingText}</p>
            </div>
          )}
          {generationError && (
            <p className="mt-4 text-red-500 text-[13px] font-semibold">{generationError}</p>
          )}
        </div>
      )}

      <div className="border-t-4 border-green-600 bg-white">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-3.5 bg-green-600 rounded-sm" />
            <span className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Mốc thời gian nhận định AI</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MILESTONES.map(({ key, label }) => {
              const available = getMilestoneAvailability(key, isFinished, isLive, isSecondHalf, isPastStartTime);
              const isSelected = selectedMilestone === key;
              const hist = key === 'LIVE' ? null : predictionHistory.find(h => h.milestone === key);
              const hasData = available && (!!hist || (key === 'LIVE' && isDataPreview && predictionData));

              return (
                <button
                  key={key}
                  disabled={!available}
                  onClick={() => available && onSelectMilestone(key)}
                  className={[
                    'px-4 py-2 rounded text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-sm',
                    isSelected
                      ? 'bg-green-600 border-green-600 text-white'
                      : available
                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed',
                    !hasData ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span>{label}</span>
                  {!hasData && <span className="text-[9px] text-slate-400 font-semibold italic">(Chưa có)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {isGenerating ? (
          <div className="bg-slate-50 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full border-[3px] border-green-500 border-t-transparent animate-spin mb-4" />
            <p className="text-green-600 text-[13px] font-bold uppercase tracking-wider">{loadingText}</p>
          </div>
        ) : (
          <>
            <div className="bg-green-50/50 border-b border-green-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-6">
              <p className="text-green-800 font-black uppercase tracking-widest text-[11px] flex items-center gap-2">
                <Bot className="w-4 h-4" /> Báo cáo phân tích AI đã sẵn sàng
              </p>
              {activePrediction && (
                <Button
                  onClick={onPin}
                  disabled={isPinning}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] uppercase tracking-wider py-1.5 px-4 rounded shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
                >
                  📌 {isPinning ? 'Đang ghim...' : 'Ghim nhận định này'}
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
        )}
      </div>
    </>
  );
}
