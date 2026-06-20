/**
 * sport.ts — Type definitions cho Sport domain (matches, teams, predictions)
 */
import { TeamRef, MatchProbabilities } from './common';
export type { TeamRef, MatchProbabilities };

export interface Match {
  id: string;
  date: string;
  time: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  scoreA: string;
  scoreB: string;
  status: string;
  league: string;
  round: string;
}

export interface TheSportsDBEvent {
  idEvent: string;
  strTimestamp: string; 
  strEvent: string;
  strSport: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  strLeague: string;
  intRound?: string | number;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
}
