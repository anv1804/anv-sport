import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/aiBox';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { getWinProbability } from '@/lib/utils';

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
  if (events.length === 0) {
    return {
      total: 0,
      team1Wins: 0,
      draws: 0,
      team2Wins: 0,
      recentMatches: []
    };
  }

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
    const { title, matchData, historyOnly, previewOnly, action, predictionData } = body;

    const matchId = matchData?.id || body.matchId;

    if (action === 'pin' && matchId && predictionData) {
      const existingPinned = await prisma.predictionHistory.findFirst({
        where: { matchId, milestone: 'PINNED' }
      });

      let pinnedRecord;
      if (existingPinned) {
        pinnedRecord = await prisma.predictionHistory.update({
          where: { id: existingPinned.id },
          data: {
            prediction: predictionData,
            predictedAt: new Date(),
            scoreState: (matchData?.score1 !== null && matchData?.score2 !== null) ? `${matchData.score1}-${matchData.score2}` : "0-0",
            liveTime: matchData?.liveClock || null,
            status: matchData?.status || "Đang đấu"
          }
        });
      } else {
        pinnedRecord = await prisma.predictionHistory.create({
          data: {
            matchId,
            milestone: 'PINNED',
            prediction: predictionData,
            scoreState: (matchData?.score1 !== null && matchData?.score2 !== null) ? `${matchData.score1}-${matchData.score2}` : "0-0",
            liveTime: matchData?.liveClock || null,
            status: matchData?.status || "Đang đấu"
          }
        });
      }

      const history = await prisma.predictionHistory.findMany({
        where: { matchId },
        orderBy: { predictedAt: 'desc' }
      });

      return NextResponse.json({ success: true, pinned: pinnedRecord, history });
    }

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
    
    const hasRealForm = matchData?.lastFiveGames && matchData.lastFiveGames.length > 0;
    const hasRealH2H = matchData?.headToHeadGames && matchData.headToHeadGames.length > 0;
    
    const isLive = statusLower !== 'chưa diễn ra' && 
                   statusLower !== 'upcoming' && 
                   statusLower !== 'ns' && 
                   statusLower !== 'tbd' &&
                   statusLower !== 'chưa đá' &&
                   !statusLower.includes('chưa đá') &&
                   !statusLower.includes('scheduled') &&
                   !statusLower.includes('chưa bắt đầu') &&
                   !statusLower.includes('chưa diễn ra') &&
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
        const cachedPrediction = (cached.data as any).prediction;
        
        const requestedMilestone = body.milestone;
        if (requestedMilestone) {
          const exists = await prisma.predictionHistory.findFirst({
            where: { matchId, milestone: requestedMilestone }
          });
          if (!exists) {
            await prisma.predictionHistory.create({
              data: {
                matchId,
                milestone: requestedMilestone,
                prediction: cachedPrediction,
                scoreState: (matchData?.score1 !== null && matchData?.score2 !== null) ? `${matchData.score1}-${matchData.score2}` : "0-0",
                liveTime: null,
                status: matchData?.status || "Chưa diễn ra"
              }
            });
          }
        }

        const history = await prisma.predictionHistory.findMany({
          where: { matchId },
          orderBy: { predictedAt: 'desc' }
        });

        return NextResponse.json({ predictionData: cachedPrediction, history });
      }
    }

    let additionalContextObj: any = {};
    
    // Load tactical reference database
    let aiTacticalTrainingGuide = "";
    try {
      const guidePath = path.join(process.cwd(), 'src/lib/tactics/AI_TACTICAL_TRAINING_GUIDE.md');
      if (fs.existsSync(guidePath)) {
        aiTacticalTrainingGuide = fs.readFileSync(guidePath, 'utf-8');
      }
    } catch (err) {
      console.error("Lỗi khi đọc file chiến thuật tham khảo:", err);
    }

    if (matchData) {
      const getEnglishStatus = (status: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('chưa đá') || s.includes('chưa diễn ra') || s.includes('chưa bắt đầu') || s.includes('upcoming') || s.includes('ns')) return 'Upcoming';
        if (s.includes('đang đá') || s.includes('live') || s.includes('in-progress') || s.includes('trực tiếp')) return 'Live';
        if (s.includes('kết thúc') || s.includes('đã kết thúc') || s === 'ft' || s === 'finished' || s === 'post') return 'Finished';
        return status;
      };

      const getEnglishPeriod = (period: string) => {
        const p = (period || '').toLowerCase();
        if (p.includes('hiệp 1') || p.includes('1st')) return '1st Half';
        if (p.includes('hiệp 2') || p.includes('2nd')) return '2nd Half';
        if (p.includes('nghỉ giữa hiệp') || p.includes('halftime') || p === 'ht') return 'Halftime';
        if (p.includes('hiệp phụ')) return 'Extra Time';
        return period;
      };

      additionalContextObj = {
        current_match_situation: {
          status: getEnglishStatus(matchData.status),
          live_period: matchData.livePeriod ? getEnglishPeriod(matchData.livePeriod) : null,
          live_clock: matchData.liveClock,
          current_score: `${t1} ${matchData.score1} - ${matchData.score2} ${t2}`,
          live_statistics: matchData.statistics,
          lineups: matchData.lineups,
          events: matchData.events
        }
      };

      if (hasRealForm || hasRealH2H) {
        const realT1Form = parseRealForm(matchData.lastFiveGames, t1);
        const realT2Form = parseRealForm(matchData.lastFiveGames, t2);
        const realH2H = parseRealH2H(matchData.headToHeadGames, t1, t2);
        
        additionalContextObj.ground_truth_stats = {
          team_1_form: realT1Form,
          team_2_form: realT2Form,
          historical_h2h: realH2H
        };
      }
      
      additionalContextObj.historical_accuracy_rules = [
        "Use your real-world soccer database knowledge to accurately populate the 'formAndH2h' fields.",
        "Spain has never lost to Saudi Arabia in real-world history, so Spain wins/draws distribution must align with this reality. No fake historical outcomes.",
        "CRITICAL FOR H2H (HEAD-TO-HEAD): For national team matches, head-to-head history MUST include ALL historical matches at the senior national team level, across all tournaments (World Cup, Qualifiers, Continental Cups, Nations League, etc.) and friendlies. DO NOT include youth or U teams (e.g. U23, U21, Olympic teams). Rely on your database to return the correct historical results, dates, and scores.",
        "If the two teams have never faced each other in history, set total: 0, team1Wins: 0, draws: 0, team2Wins: 0, and recentMatches: [] (empty array)."
      ];
    }

    const systemPrompt = `You are a world-class football analyst, tactical editor, and mathematical modeler.
    
    CRITICAL INSTRUCTION:
    You must strictly read and execute the 4-step tactical thinking process defined in the AI_TACTICAL_TRAINING_GUIDE:
    - Step 1: Contextual Analysis (using external_factors_and_key_events).
    - Step 2: Tactical Matchup (using formations_and_playstyles).
    - Step 3: Player Roles & Matchups (using player_roles_and_tendencies).
    - Step 4: Psychological & Live Scenarios (using match_dynamics_and_psychology).
    
    You must synthesize information from at least these 5 reputable football analytics sources:
    1. SofaScore (detailed stats and player ratings)
    2. WhoScored (tactical characteristics & player strengths/weaknesses)
    3. ESPN / ESPN FC (match previews and team news)
    4. The Athletic (tactical breakdowns and long-form analysis)
    5. Foreign betting market odds (Asian Handicap movements, Over/Under lines, and market shifts)
    
    Deliver a highly professional, comprehensive sports editorial analysis.
    
    [TASK CONFIGURATION (JSON)]
    ${JSON.stringify({
      task: `Analyze the football match: "${title}" in extreme detail.`,
      ai_tactical_training_guide: aiTacticalTrainingGuide,
      sources_to_synthesize: [
        "SofaScore detailed match stats and player ratings",
        "WhoScored tactical characteristics & player strengths/weaknesses",
        "ESPN ESPN FC match previews and team news",
        "The Athletic tactical breakdowns and long-form analysis",
        "Foreign betting market odds, Asian Handicap movements, and Over/Under line shifts"
      ],
      tactical_analysis_requirements: {
        formation_counter_strategies: "Compare the two systems (e.g., 4-3-3 vs 4-2-3-1). Explain exactly how they counter each other. Who has the central numerical overload? Which spaces (flanks, half-spaces, behind the defensive line) are vulnerable? Explain how one team can bypass the other's pressing block (e.g., inverting fullbacks, dropping pivots, direct long balls).",
        match_flow_dynamics: "Detail the transition phases (Defending to Attacking, Attacking to Defending), pressing block height (high press, mid-block, compact low block), and possession tempo (slow build-up vs rapid verticality).",
        player_tendencies: "Highlight individual movements, key player roles (e.g., Carrilero, Regista, Mezzala, Raumdeuter, Inverted Wing-back), and player-to-player duels.",
        live_match_tactics: "If the match is live, analyze how the current score and live statistics (shots on target, possession, cards, momentum) affect the tactical approach of both managers for the rest of the match."
      },
      probabilistic_modeling_rules: {
        guidelines: [
          "Compare relative squads' value, international rankings, FIFA ranking gap, and player quality.",
          "Analyze continental playstyle differences (e.g., European tactical possession vs Asian low-block discipline).",
          "If head-to-head matches are empty (0 games played), base probability distribution strictly on recent form trends against similar-tier opponents and overall tournament stakes."
        ]
      },
      live_match_rules: {
        is_live_match: isLive,
        score_state: isLive ? `${matchData?.score1} - ${matchData?.score2}` : "N/A",
        rules: [
          "CRITICAL: Adapt predictions and tactical blocks to the live score state in real-time.",
          "PROBABILITIES: Probabilities must reflect the live score. If a team leads by 3+ goals, win probability must be 95%-99%. Draw/loss probabilities must be 1%-5%. Never output pre-match probabilities for live matches.",
          "IN-PLAY ANALYSIS: Address changes in tactics during half-time, player fatigue, manager adjustments, and risk-taking behaviors (e.g., committing more players forward if trailing)."
        ]
      },
      analytical_factors: [
        "Historical Head-to-Head (H2H) results and current tournament standings",
        "Recent form (last 5 matches) and individual player fitness/morale",
        "Squad market value differences and overall squad depth",
        "Lineups & Formations (Prioritize official lineups if available in matchData.lineups, otherwise predict them using the tactics database)",
        "Team morale, objectives (relegation battle, title race, local derby), and match significance"
      ],
      output_metrics_rules: {
        expectedGoals: {
          predicted: "Estimated number of goals, localized in Vietnamese (e.g., '1 bàn', '2 bàn', '3 bàn')",
          ouLine: "Bookmaker Over/Under line (e.g., '0.75', '1.5', '2.5')",
          ouPick: "Over/Under pick recommendation direction, must be either 'Tài' or 'Xỉu' in Vietnamese"
        },
        expectedCards_expectedCorners: "Provide logically consistent values for half1, half2, and fullMatch (e.g., half1 + half2 = fullMatch)."
      },
      language_requirements: {
        analysisHtml: "Must be written in detailed Vietnamese, using highly professional sports terminology. Break the analysis into clear, structured HTML sections with headings, subheadings, and bold text. Deliver deep, professional tactical breakdowns comparable to elite journals like The Athletic. Avoid generic filler text.",
        sources_titles: "Must be written in Vietnamese",
        expectedGoals_predicted: "Must use 'bàn' unit in Vietnamese (e.g. '1 bàn')",
        expectedGoals_ouPick: "Must use 'Tài' or 'Xỉu' in Vietnamese"
      }
    }, null, 2)}
    
    [ADDITIONAL DATA CONTEXT (JSON)]
    ${JSON.stringify(additionalContextObj, null, 2)}
    
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
      if (!result.predictionData.header) {
        result.predictionData.header = {};
      }
      result.predictionData.header.team1 = { name: t1, logo: matchData?.team1?.logo || '' };
      result.predictionData.header.team2 = { name: t2, logo: matchData?.team2?.logo || '' };
      result.predictionData.header.matchTime = `${matchData?.matchTime || ''}, ${matchData?.matchDate || ''}`;
      result.predictionData.header.tournament = matchData?.category || result.predictionData.header.tournament;
      
      const prob = getWinProbability(matchId, t1, t2);
      result.predictionData.header.probabilities = { team1: prob.w1, draw: prob.draw, team2: prob.w2 };

      if (!result.predictionData.formAndH2h) {
        result.predictionData.formAndH2h = {};
      }
      
      if (hasRealForm) {
        result.predictionData.formAndH2h.team1Form = parseRealForm(matchData.lastFiveGames, t1) || getDeterministicForm(t1);
        result.predictionData.formAndH2h.team2Form = parseRealForm(matchData.lastFiveGames, t2) || getDeterministicForm(t2);
      }
      
      const categoryLower = (matchData?.category || '').toLowerCase();
      const isNationalTeamMatch = categoryLower.includes('world cup') || 
                                  categoryLower.includes('euro') || 
                                  categoryLower.includes('copa') || 
                                  categoryLower.includes('nations league') || 
                                  categoryLower.includes('friendly') ||
                                  categoryLower.includes('fifa') ||
                                  categoryLower.includes('concacaf') ||
                                  categoryLower.includes('afcon') ||
                                  categoryLower.includes('asian cup') ||
                                  categoryLower.includes('vòng loại');
      
      if (hasRealH2H) {
        const aiHasH2H = result.predictionData.formAndH2h?.h2hData && 
                         Array.isArray(result.predictionData.formAndH2h.h2hData.recentMatches);
        if (!isNationalTeamMatch || !aiHasH2H) {
          result.predictionData.formAndH2h.h2hData = parseRealH2H(matchData.headToHeadGames, t1, t2) || getDeterministicH2H(t1, t2);
        }
      }

      if (!previewOnly) {
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
          const milestone = body.milestone || (isLive ? "LIVE" : "PRE_MATCH");
          const scoreState = (matchData?.score1 !== null && matchData?.score2 !== null)
            ? `${matchData.score1}-${matchData.score2}`
            : "0-0";
          const liveTime = isLive ? (matchData?.liveClock || "Đang đấu") : null;
          
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
