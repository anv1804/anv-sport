// Simple string clean helper to compare club names
function localClean(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

export interface ESPNMatch {
  id: string;
  tournament: string;
  date: string;
  status: string;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  score1: number;
  score2: number;
  playerRating: string | null;
}

export interface ESPNAthleteInfo {
  id: string;
  leagueSlug: string;
  fullName: string;
  jersey: string;
  position: string;
  avatar: string | null;
  teamId: string | null;
  teamName: string | null;
  teamLogo: string | null;
  height: number | null;
  weight: string | null;
  birthDate: string | null;
  nationality: string | null;
  stats: {
    goals: number;
    assists: number;
    appearances: number;
  } | null;
}

export async function searchESPNPlayer(name: string, clubName?: string): Promise<{ id: string; leagueSlug: string } | null> {
  try {
    const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(name)}&limit=10&type=player`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    
    // Find players group in results
    const playerResult = data.results?.find((r: any) => r.type === 'player');
    if (!playerResult || !playerResult.contents) return null;

    const soccerPlayers = playerResult.contents.filter((p: any) => p.sport === 'soccer');
    if (soccerPlayers.length === 0) return null;

    // Try to match club name if provided
    if (clubName) {
      const targetClubClean = localClean(clubName);
      for (const p of soccerPlayers) {
        const subtitleClean = localClean(p.subtitle || '');
        const descriptionClean = localClean(p.description || '');
        if (
          subtitleClean.includes(targetClubClean) || 
          targetClubClean.includes(subtitleClean) ||
          descriptionClean.includes(targetClubClean) ||
          targetClubClean.includes(descriptionClean)
        ) {
          const athleteId = p.uid?.split('~a:')?.[1] || p.id;
          return { id: athleteId, leagueSlug: p.defaultLeagueSlug || 'eng.1' };
        }
      }
    }

    // Default to the first soccer player match
    const bestMatch = soccerPlayers[0];
    const athleteId = bestMatch.uid?.split('~a:')?.[1] || bestMatch.id;
    return { id: athleteId, leagueSlug: bestMatch.defaultLeagueSlug || 'eng.1' };
  } catch (err) {
    console.error('Error in searchESPNPlayer:', err);
    return null;
  }
}

export async function getESPNPlayerDetails(athleteId: string, leagueSlug: string): Promise<ESPNAthleteInfo | null> {
  try {
    const url = `https://site.api.espn.com/apis/common/v3/sports/soccer/leagues/${leagueSlug}/athletes/${athleteId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const athlete = data.athlete;
    if (!athlete) return null;

    // Parse height (e.g. "5'\'' 7\"" or standard format)
    let parsedHeight: number | null = null;
    if (athlete.displayHeight) {
      // Check if inches format (e.g., 5' 7")
      const inchMatch = athlete.displayHeight.match(/(\d+)'\s*(\d+)/);
      if (inchMatch) {
        const feet = parseInt(inchMatch[1]);
        const inches = parseInt(inchMatch[2]);
        parsedHeight = Math.round((feet * 12 + inches) * 2.54);
      } else {
        const cmMatch = athlete.displayHeight.match(/(\d+)\s*cm/);
        if (cmMatch) {
          parsedHeight = parseInt(cmMatch[1]);
        }
      }
    }

    // Parse stats
    let stats = null;
    if (athlete.statsSummary?.statistics) {
      const goalsStat = athlete.statsSummary.statistics.find((s: any) => s.name === 'totalGoals');
      const assistsStat = athlete.statsSummary.statistics.find((s: any) => s.name === 'goalAssists');
      const appsStat = athlete.statsSummary.statistics.find((s: any) => s.name === 'starts-subIns');

      stats = {
        goals: goalsStat ? Number(goalsStat.value) || 0 : 0,
        assists: assistsStat ? Number(assistsStat.value) || 0 : 0,
        appearances: appsStat ? Number(appsStat.value) || 0 : 0
      };
    }

    // Parse BirthDate: displayDOB format is e.g. "24/6/1987"
    let birthDate: string | null = null;
    if (athlete.displayDOB) {
      const parts = athlete.displayDOB.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        birthDate = `${year}-${month}-${day}`;
      }
    }

    return {
      id: athlete.id,
      leagueSlug: leagueSlug,
      fullName: athlete.fullName || athlete.displayName,
      jersey: athlete.jersey || athlete.displayJersey?.replace('#', '') || '',
      position: athlete.position?.displayName || '',
      avatar: athlete.headshot?.href || null,
      teamId: athlete.team?.id || null,
      teamName: athlete.team?.displayName || athlete.team?.name || null,
      teamLogo: athlete.team?.logos?.[0]?.href || (athlete.team?.id ? `https://a.espncdn.com/i/teamlogos/soccer/500/${athlete.team.id}.png` : null),
      height: parsedHeight,
      weight: athlete.displayWeight || null,
      birthDate,
      nationality: athlete.citizenship || athlete.citizenshipCountry?.abbreviation || null,
      stats
    };
  } catch (err) {
    console.error('Error in getESPNPlayerDetails:', err);
    return null;
  }
}

export async function getESPNRecentMatches(teamId: string, leagueSlug: string, limit = 5): Promise<ESPNMatch[]> {
  try {
    const currentYear = new Date().getFullYear();
    const seasonsToTry = [currentYear, currentYear - 1, currentYear + 1];
    let events: any[] = [];

    for (const yr of seasonsToTry) {
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueSlug}/teams/${teamId}/schedule?season=${yr}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          events = data.events;
          break;
        }
      }
    }

    if (events.length === 0) {
      // Try 'all' league slug as a fallback
      const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/${teamId}/schedule?season=${currentYear - 1}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.events) {
          events = data.events;
        }
      }
    }

    // Get completed matches and sort desc by date
    const completedEvents = events
      .filter((e: any) => e.status?.type?.state === 'post' || e.status?.type?.completed === true)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recentEvents = completedEvents.slice(0, limit);

    return recentEvents.map((evt: any) => {
      const comp = evt.competitions?.[0];
      const team1 = comp?.competitors?.[0];
      const team2 = comp?.competitors?.[1];

      return {
        id: evt.id,
        tournament: evt.league?.name || evt.season?.name || 'Football Match',
        date: evt.date,
        status: evt.status?.type?.shortDetail || 'FT',
        team1: {
          name: team1?.team?.displayName || team1?.team?.name || 'Home',
          logo: team1?.team?.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${team1?.team?.id}.png`
        },
        team2: {
          name: team2?.team?.displayName || team2?.team?.name || 'Away',
          logo: team2?.team?.logo || `https://a.espncdn.com/i/teamlogos/soccer/500/${team2?.team?.id}.png`
        },
        score1: team1?.score?.value ?? 0,
        score2: team2?.score?.value ?? 0,
        playerRating: null
      };
    });
  } catch (err) {
    console.error('Error in getESPNRecentMatches:', err);
    return [];
  }
}
