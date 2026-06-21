import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/aiBox';
import prisma from '@/lib/prisma';

// Helper function to generate deterministic Head-to-Head history based on team names (Fallback only)
function getDeterministicH2H(team1: string, team2: string) {
  const combined = [team1, team2].sort().join('-');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0; 
  }
  
  const absHash = Math.abs(hash);
  const total = 5 + (absHash % 4); // 5 to 8 matches
  const team1Wins = absHash % (total - 1);
  const draws = (absHash >> 2) % (total - team1Wins);
  const team2Wins = total - team1Wins - draws;

  const recentMatches = [];
  const years = [2025, 2024, 2023, 2022, 2021];
  for (let i = 0; i < Math.min(total, 5); i++) {
    const matchHash = absHash + i * 31;
    const score1 = matchHash % 3;
    const score2 = (matchHash >> 2) % 3;
    const date = `15/06/${years[i % years.length]}`;
    recentMatches.push({
      date,
      score: `${score1}-${score2}`,
      winner: score1 > score2 ? 1 : (score2 > score1 ? 2 : 0)
    });
  }

  return {
    total,
    team1Wins,
    draws,
    team2Wins,
    recentMatches
  };
}

// Helper function to generate deterministic form based on team name (Fallback only)
function getDeterministicForm(team: string) {
  let hash = 0;
  for (let i = 0; i < team.length; i++) {
    hash = (hash << 5) - hash + team.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const outcomes = ["W", "D", "L"];
  const form = [];
  for (let i = 0; i < 5; i++) {
    form.push(outcomes[(absHash + i) % 3]);
  }
  return form;
}

// Parse real Head-to-Head from ESPN data structure
function parseRealH2H(headToHeadGames: any, t1Name: string, t2Name: string) {
  if (!headToHeadGames || headToHeadGames.length === 0) return null;
  
  const events = headToHeadGames[0]?.events || [];
  if (events.length === 0) return null;

  let team1Wins = 0;
  let draws = 0;
  let team2Wins = 0;
  const recentMatches = [];

  for (const evt of events) {
    const score = evt.score || "";
    const dateRaw = evt.gameDate ? new Date(evt.gameDate) : null;
    const dateStr = dateRaw && !isNaN(dateRaw.getTime()) 
      ? dateRaw.toLocaleDateString('vi-VN') 
      : "";
    
    const scoreParts = score.split('-').map((s: string) => parseInt(s.trim()));
    let homeScore = 0;
    let awayScore = 0;
    if (scoreParts.length === 2) {
      homeScore = scoreParts[0];
      awayScore = scoreParts[1];
    } else {
      homeScore = parseInt(evt.homeTeamScore) || 0;
      awayScore = parseInt(evt.awayTeamScore) || 0;
    }

    const opponentName = evt.opponent?.displayName || "";
    const isOpponentTeam1 = opponentName.toLowerCase().includes(t1Name.toLowerCase()) || 
                             t1Name.toLowerCase().includes(opponentName.toLowerCase());

    let winner = 0;
    if (homeScore === awayScore) {
      draws++;
      winner = 0;
    } else {
      const isHomeTeam1 = !isOpponentTeam1;
      if (isHomeTeam1) {
        if (homeScore > awayScore) {
          team1Wins++;
          winner = 1;
        } else {
          team2Wins++;
          winner = 2;
        }
      } else {
        if (homeScore > awayScore) {
          team2Wins++;
          winner = 2;
        } else {
          team1Wins++;
          winner = 1;
        }
      }
    }

    recentMatches.push({
      date: dateStr,
      score: `${homeScore}-${awayScore}`,
      winner
    });
  }

  return {
    total: events.length,
    team1Wins,
    draws,
    team2Wins,
    recentMatches: recentMatches.slice(0, 5)
  };
}

// Parse real form from ESPN data structure
function parseRealForm(lastFiveGames: any, tName: string) {
  if (!lastFiveGames || lastFiveGames.length !== 2) return null;
  
  const teamItem = lastFiveGames.find((item: any) => {
    const displayName = item.team?.displayName || "";
    return displayName.toLowerCase().includes(tName.toLowerCase()) || 
           tName.toLowerCase().includes(displayName.toLowerCase());
  });

  if (!teamItem || !teamItem.events || teamItem.events.length === 0) return null;

  return teamItem.events.slice(0, 5).map((evt: any) => {
    const res = evt.gameResult || "D";
    return ["W", "D", "L"].includes(res) ? res : "D";
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, matchData, historyOnly } = body;

    const matchId = matchData?.id || body.matchId;

    if (historyOnly && matchId) {
      const history = await prisma.predictionHistory.findMany({
        where: { matchId },
        orderBy: { predictedAt: 'desc' }
      });
      return NextResponse.json({ success: true, history });
    }

    if (!title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề trận đấu' }, { status: 400 });
    }

    const t1 = matchData?.team1?.name || "Đội nhà";
    const t2 = matchData?.team2?.name || "Đội khách";
    const statusLower = (matchData?.status || '').toLowerCase();
    
    const isLive = statusLower !== 'chưa diễn ra' && 
                   statusLower !== 'upcoming' && 
                   statusLower !== 'ns' && 
                   statusLower !== 'tbd' &&
                   statusLower !== 'ft' && 
                   statusLower !== 'aet' && 
                   statusLower !== 'pen' && 
                   statusLower !== 'finished' && 
                   !statusLower.includes('kết thúc') &&
                   !statusLower.includes('đã kết thúc');

    // 1. Check if we have a cached prediction in the Database (Only for upcoming or finished matches)
    if (matchId && !isLive) {
      const cached = await prisma.fixtureCache.findUnique({ where: { id: matchId } });
      if (cached && (cached.data as any).prediction) {
        return NextResponse.json({ predictionData: (cached.data as any).prediction });
      }
    }

    const hasRealH2H = matchData?.headToHeadGames && matchData.headToHeadGames.length > 0;
    const hasRealForm = matchData?.lastFiveGames && matchData.lastFiveGames.length === 2;
    
    let additionalContext = "";
    if (matchData) {
      additionalContext = `
[CURRENT MATCH SITUATION]
- Status: ${matchData.status}
- Current Score: ${t1} ${matchData.score1} - ${matchData.score2} ${t2}
- Live Match Context (JSON): ${JSON.stringify({
        score1: matchData.score1,
        score2: matchData.score2,
        status: matchData.status,
        statistics: matchData.statistics,
        lineups: matchData.lineups,
        events: matchData.events
      })}

[TREATMENT RULES FOR LIVE MATCHES]
${isLive ? `- CRITICAL: The match is currently IN-PLAY. Your analysis and predictions must adapt to the live score (${matchData.score1} - ${matchData.score2}) and game state in real-time.
- PROBABILITIES RULE: The 'probabilities' field must dynamically reflect the live score. For example, if a team is leading by 3+ goals (e.g., 3-0), their win probability must be extremely high (95% to 99%), while the draw and loss probabilities must be miniscule (1% to 5%). Never output pre-match probabilities for in-play matches.` : '- The match has not started yet. Analyze based on pre-match contexts.'}

[REQUIRED ANALYTICAL FACTORS]
You must synthesize the following factors to produce the prediction:
1. Head-to-Head (H2H) history & current league table standings.
2. Recent team forms and individual star player forms.
3. Squad values showing the quality gap between the two sides.
4. Lineups & Formations: If 'matchData.lineups' contains official lineups, you MUST prioritize them. Otherwise, predict the lineups and formations based on injury/suspension news.
5. Tactical Counter-strategies (Matchups), playstyles, strengths, weaknesses, team morale, and match goals (e.g. title race, relegation struggle).
`;

      if (hasRealForm || hasRealH2H) {
        const realT1Form = parseRealForm(matchData.lastFiveGames, t1);
        const realT2Form = parseRealForm(matchData.lastFiveGames, t2);
        const realH2H = parseRealH2H(matchData.headToHeadGames, t1, t2);
        
        additionalContext += `
[GROUND TRUTH DATA TO COOP IN formAndH2h]
${realT1Form ? `- Team 1 Form: ${JSON.stringify(realT1Form)}` : ''}
${realT2Form ? `- Team 2 Form: ${JSON.stringify(realT2Form)}` : ''}
${realH2H ? `- Historical H2H: ${JSON.stringify(realH2H)}` : ''}
`;
      } else {
        additionalContext += `
[HISTORICAL ACCURACY RULE]
- You must leverage your real-world soccer database knowledge to accurately populate the 'formAndH2h' fields. For example, Spain has never lost to Saudi Arabia in real-world football history, so your historical wins/draws distribution must accurately align with this reality. Never hallucinate fake historical outcomes.
`;
      }
    }

    const systemPrompt = `You are a world-class football analyst and tactical expert with acute understanding of sports analytics and bookmaker odd lines.
    Your task: Analyze the football match: "${title}" in extreme detail.
    
    [ADDITIONAL DATA CONTEXT]
    ${additionalContext}
    
    [SPECIFIC ANALYSIS GUIDELINES]
    1. SYNTHESIS: Gather and cross-reference analysis from elite sports networks (e.g., SofaScore, WhoScored, ESPN, The Athletic) and foreign betting markets to establish realistic expectations.
    2. TACTICAL COUNTER-STRATEGIES: Detail how the formations and setups of both teams counteract or unlock spaces for each other (e.g., central midfield superiority, overload zones, low block solutions).
    3. MATCH FLOW: Describe the in-play flow, pressing intensities, transitional phases, and possession tendencies.
    4. PLAYER TENDENCIES: Highlight individual player movements and roles (e.g., inverted wingers cutting inside, box-to-box midfielders dictating play, full-back overlaps).
    5. expectedGoals STRUCTURE: Predict Expected Goals (expectedGoals) using an object structure containing three string keys:
       - "predicted": Estimated number of goals (e.g., "1 bàn", "2 bàn", "3 bàn").
       - "ouLine": Bookmaker Over/Under line (e.g., "0.75", "1.5", "2.5").
       - "ouPick": Recommendation direction ("Tài" or "Xịu").
    6. expectedCards & expectedCorners: Ensure cards and corners are predicted for "half1", "half2", and "fullMatch" in a logically consistent manner (e.g., half1 + half2 = fullMatch).
    7. LANGUAGE AND LOCALE: You MUST write the detailed 'analysisHtml' content and source names/titles in Vietnamese, and use 'bàn' for 'predicted' goals counts and 'Tài'/'Xịu' for O/U picks (ouPick) so it matches the Vietnamese localization of the application.
    
    [OUTPUT REQUIREMENT]
    Provide a valid JSON matching EXACTLY the structure below. Do not wrap the JSON output in markdown formatting (no json wrappers):

    {
      "predictionData": {
        "header": {
          "team1": { "name": "${t1}", "logo": "${matchData?.team1?.logo || ''}" },
          "team2": { "name": "${t2}", "logo": "${matchData?.team2?.logo || ''}" },
          "matchTime": "Match time (e.g., ${matchData?.matchTime || '02:00'}, ${matchData?.matchDate || '18/06/2026'})",
          "tournament": "${matchData?.category || 'Other Tournament'}",
          "probabilities": { "team1": 45, "draw": 25, "team2": 30 }
        },
        "formAndH2h": {
          "team1Form": ["W", "W", "D", "L", "W"],
          "team2Form": ["W", "D", "W", "W", "W"],
          "h2hData": {
            "total": 5,
            "team1Wins": 2,
            "draws": 1,
            "team2Wins": 2,
            "recentMatches": [
              { "date": "10/05/2024", "score": "2-1", "winner": 1 }
            ]
          }
        },
        "lineups": {
          "team1Formation": "${matchData?.lineups?.[0]?.formation || '4-3-3'}",
          "team2Formation": "${matchData?.lineups?.[1]?.formation || '4-2-3-1'}",
          "missingPlayers": { "team1": [], "team2": [] }
        },
        "advancedMetrics": {
          "expectedGoals": {
            "half1": { "predicted": "1 bàn", "ouLine": "0.75", "ouPick": "Tài" },
            "half2": { "predicted": "2 bàn", "ouLine": "1.5", "ouPick": "Tài" },
            "fullMatch": { "predicted": "3 bàn", "ouLine": "2.25", "ouPick": "Tài" }
          },
          "expectedCards": {
            "half1": { "team1": 0, "team2": 1, "total": 1 },
            "half2": { "team1": 1, "team2": 1, "total": 2 },
            "fullMatch": { "team1": 1, "team2": 2, "total": 3 }
          },
          "expectedCorners": {
            "half1": { "team1": 2, "team2": 1, "total": 3 },
            "half2": { "team1": 3, "team2": 2, "total": 5 },
            "fullMatch": { "team1": 5, "team2": 3, "total": 8 }
          }
        },
        "analysisHtml": "<h3>1. Tình hình lực lượng & Diễn biến</h3><p>Nội dung chi tiết...</p><h3>2. Chiến thuật & Nhận định</h3><p>Nội dung...</p>",
        "sources": [
          { "title": "Phân tích đội hình...", "url": "https://vnexpress.net/the-thao", "siteName": "VNExpress" }
        ]
      }
    }`;

    let contentText = "{}";

    try {
      contentText = await generateWithFallback(
        systemPrompt,
        'You are a highly capable JSON data generation assistant.',
        true
      );
    } catch (err: any) {
      return NextResponse.json({ error: `Có lỗi xảy ra khi tạo nhận định: ${err.message}` }, { status: 500 });
    }

    const result = JSON.parse(contentText);

    // Apply real API data override if available, otherwise let the AI's knowledgeable response stand
    if (result.predictionData) {
      if (!result.predictionData.formAndH2h) {
        result.predictionData.formAndH2h = {};
      }
      
      if (hasRealForm) {
        result.predictionData.formAndH2h.team1Form = parseRealForm(matchData.lastFiveGames, t1) || getDeterministicForm(t1);
        result.predictionData.formAndH2h.team2Form = parseRealForm(matchData.lastFiveGames, t2) || getDeterministicForm(t2);
      }
      
      if (hasRealH2H) {
        result.predictionData.formAndH2h.h2hData = parseRealH2H(matchData.headToHeadGames, t1, t2) || getDeterministicH2H(t1, t2);
      }

      // 3. Cache the generated prediction in the Database (Only for upcoming or finished matches)
      if (matchId && !isLive) {
        const cached = await prisma.fixtureCache.findUnique({ where: { id: matchId } });
        if (cached) {
          const updatedData = {
            ...(cached.data as any),
            prediction: result.predictionData
          };
          await prisma.fixtureCache.update({
            where: { id: matchId },
            data: { data: updatedData }
          });
        }
      }

      // 4. Save this checkpoint into PredictionHistory
      if (matchId) {
        const milestone = isLive ? "LIVE" : "PRE_MATCH";
        const scoreState = (matchData?.score1 !== null && matchData?.score2 !== null)
          ? `${matchData.score1}-${matchData.score2}`
          : "0-0";
        const liveTime = isLive ? (matchData?.liveClock || "Đang đá") : null;
        
        await prisma.predictionHistory.create({
          data: {
            matchId,
            milestone,
            prediction: result.predictionData,
            scoreState,
            liveTime,
            status: matchData?.status || "Chưa diễn ra"
          }
        });
      }
    }

    const history = matchId ? await prisma.predictionHistory.findMany({
      where: { matchId },
      orderBy: { predictedAt: 'desc' }
    }) : [];

    return NextResponse.json({ ...result, history });

  } catch (error: any) {
    console.error('Prediction Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Có lỗi xảy ra khi tạo nhận định' }, { status: 500 });
  }
}
