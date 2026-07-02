export interface FixtureTeam { name: string; logo: string; }
export interface Fixture {
  id: string;
  team1: FixtureTeam;
  team2: FixtureTeam;
  category: string;
  matchDate: string;   // 'YYYY-MM-DD'
  matchTime: string;   // 'HH:MM'
  status: string;
  score1: string | null;
  score2: string | null;
  ground: string;
}
