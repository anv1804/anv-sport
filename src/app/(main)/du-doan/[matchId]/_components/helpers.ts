import { type PredictionData } from '@/components/domain/article/PredictionView';

export interface MatchInfo {
  id: string;
  category: string;
  round?: string;
  matchDate: string;
  matchTime: string;
  status: string;
  livePeriod?: string;
  liveClock?: string;
  score1: number | null;
  score2: number | null;
  penScore1?: number | null;
  penScore2?: number | null;
  ground?: string;
  video?: string;
  goals?: { home?: string; away?: string };
  statistics?: any[];
  lineups?: any[];
  events?: any[];
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
}

export interface PlayerEventSummary {
  goals: number;
  ownGoals: number;
  yellowCards: number;
  redCard: boolean;
  secondYellow: boolean;
  subbedOut: boolean;
  subbedIn: boolean;
  subMinute: number | null;
  assists: number;
  injury: boolean;
}

export interface PredictionHistoryItem {
  milestone: string;
  prediction: PredictionData;
}

export type MilestoneKey = 'PRE_MATCH' | 'START_MATCH' | 'HALF_TIME' | 'LIVE';

export function parseMatchDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function parseMatchStatus(matchInfo: MatchInfo) {
  const s = (matchInfo.status || '').toLowerCase();
  const isFinished =
    s === 'ft' || s === 'aet' || s === 'pen' || s === 'finished' ||
    s.includes('kết thúc') || s.includes('đã kết thúc');

  const isLive =
    !isFinished &&
    s !== 'chưa diễn ra' && s !== 'upcoming' && s !== 'ns' && s !== 'tbd' &&
    s !== 'chưa đá' && !s.includes('chưa đá') && !s.includes('scheduled') &&
    !s.includes('chưa bắt đầu') && !s.includes('chưa diễn ra');

  const lp = (matchInfo.livePeriod || '').toLowerCase();
  const isSecondHalf =
    isLive &&
    (s.includes('2nd half') || s.includes('hiệp 2') || lp.includes('2nd') || lp.includes('hiệp 2'));

  return { isFinished, isLive, isSecondHalf };
}

export function checkPastStartTime(matchInfo: MatchInfo): boolean {
  if (!matchInfo.matchDate || !matchInfo.matchTime) return false;
  try {
    let datePart = matchInfo.matchDate;
    if (datePart.includes('/')) {
      const parts = datePart.split('/');
      datePart = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    const d = new Date(`${datePart}T${matchInfo.matchTime}:00`);
    return !isNaN(d.getTime()) && Date.now() >= d.getTime();
  } catch (e) {
    return false;
  }
}

export function isNeutralVenue(matchInfo: MatchInfo): boolean {
  const cat = (matchInfo.category || '').toLowerCase();
  const round = (matchInfo.round || '').toLowerCase();
  return (
    cat.includes('world cup') || cat.includes('fifa') || cat.includes('friendly') ||
    cat.includes('giao hữu') || cat.includes('euro') || cat.includes('copa america') ||
    cat.includes('afcon') || cat.includes('asian cup') ||
    round.includes('chung kết') || round.includes('final') || round.includes('play-off')
  );
}

export function getMilestoneAvailability(
  milestoneKey: MilestoneKey,
  isFinished: boolean,
  isLive: boolean,
  isSecondHalf: boolean,
  isPastStartTime: boolean,
): boolean {
  if (milestoneKey === 'PRE_MATCH') return true;
  if (milestoneKey === 'START_MATCH') return isLive || isFinished || isPastStartTime;
  if (milestoneKey === 'HALF_TIME') return isSecondHalf || isFinished;
  if (milestoneKey === 'LIVE') return isLive || isFinished || isPastStartTime;
  return false;
}

export function getPlayerEventsSummary(player: any, events: any[] = []): PlayerEventSummary {
  const s: PlayerEventSummary = {
    goals: 0, ownGoals: 0, yellowCards: 0, redCard: false, secondYellow: false,
    subbedOut: false, subbedIn: false, subMinute: null, assists: 0, injury: false,
  };
  if (!events || !player) return s;

  const pName = (player.name || '').toLowerCase();
  const pId = player.id;

  for (const evt of events) {
    const evtName = (evt.player?.name || '').toLowerCase();
    const evtId = evt.player?.id;
    const assistName = (evt.assist?.name || '').toLowerCase();
    const assistId = evt.assist?.id;

    const isPrimary = pId && evtId ? pId === evtId : (evtName.includes(pName) || pName.includes(evtName));
    const isAssist = pId && assistId ? pId === assistId : (assistName.includes(pName) || pName.includes(assistName));

    if (evt.type === 'Goal') {
      if (isPrimary) evt.detail === 'Own Goal' ? s.ownGoals++ : s.goals++;
      if (isAssist && evt.detail !== 'Own Goal') s.assists++;
    } else if (evt.type === 'Card' && isPrimary) {
      if (evt.detail === 'Yellow Card') s.yellowCards++;
      else if (evt.detail === 'Second Yellow Card') { s.secondYellow = true; s.redCard = true; }
      else if (evt.detail === 'Red Card') s.redCard = true;
    } else if (evt.type === 'subst') {
      if (isPrimary) { s.subbedIn = true; s.subMinute = evt.time?.elapsed ?? null; }
      if (isAssist) {
        s.subbedOut = true;
        s.subMinute = evt.time?.elapsed ?? null;
        if (evt.detail?.toLowerCase().includes('injury') || evt.comment?.toLowerCase().includes('injury')) {
          s.injury = true;
        }
      }
    }
  }
  return s;
}
