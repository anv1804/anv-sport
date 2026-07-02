import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/aiBox';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { computePrediction } from '@/lib/matchEngine';
import { checkRateLimit } from '@/lib/cms-redis';

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
  // ── Rate limiting: 10 req/phút/IP (ảnh hưởng API AI) ────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
           || req.headers.get('x-real-ip')
           || 'unknown';
  const rl = await checkRateLimit(ip, 'generate-prediction', 10);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Quá nhiều yêu cầu. Vui lòng đợi giây lát.' },
      { status: 429, headers: { 'Retry-After': String(rl.resetInSec) } }
    );
  }

  try {
    const body = await req.json();
    const { title, matchData, historyOnly, previewOnly, action, predictionData: bodyPredictionData } = body;

    const matchId = matchData?.id || body.matchId;

    if (action === 'pin' && matchId && bodyPredictionData) {
      const existingPinned = await prisma.predictionHistory.findFirst({
        where: { matchId, milestone: 'PINNED' }
      });

      let pinnedRecord;
      if (existingPinned) {
        pinnedRecord = await prisma.predictionHistory.update({
          where: { id: existingPinned.id },
          data: {
            prediction: bodyPredictionData,
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
            prediction: bodyPredictionData,
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

    // ── Match Analytics Engine: tính toán tất cả số liệu KHÔNG dùng AI ──
    const engineResult = await computePrediction({
      matchId: matchId || '',
      team1Name: t1,
      team2Name: t2,
      category: matchData?.category,
      lastFiveGames: matchData?.lastFiveGames,
      headToHeadGames: matchData?.headToHeadGames,
      isKnockout: (matchData?.category || '').toLowerCase().includes('round of') ||
                  (matchData?.category || '').toLowerCase().includes('knockout') ||
                  (matchData?.category || '').toLowerCase().includes('tứ kết') ||
                  (matchData?.category || '').toLowerCase().includes('bán kết') ||
                  (matchData?.category || '').toLowerCase().includes('chung kết'),
    });

    // Load hướng dẫn phân tích chiến thuật
    let aiTacticalTrainingGuide = '';
    try {
      const guidePath = path.join(process.cwd(), 'src/lib/tactics/AI_TACTICAL_TRAINING_GUIDE.md');
      if (fs.existsSync(guidePath)) aiTacticalTrainingGuide = fs.readFileSync(guidePath, 'utf-8');
    } catch {}

    // ── Load kiến thức giải đấu từ DB (do Siêu Máy Tính đã học) ──────────
    let leagueKnowledgeBlock = '';
    try {
      const category = matchData?.category || '';
      // Tìm key phù hợp nhất với giải đấu của trận này
      const allKnowledge = await prisma.setting.findMany({
        where: { key: { startsWith: 'KNOWLEDGE_LEAGUE_' } },
        select: { key: true, value: true }
      });
      // Score từng key theo mức độ liên quan
      const scored = allKnowledge.map(row => {
        const leagueName = row.key.replace('KNOWLEDGE_LEAGUE_', '').replace(/_/g, ' ').toLowerCase();
        const cat = category.toLowerCase();
        let score = 0;
        leagueName.split(' ').forEach(word => { if (word.length > 2 && cat.includes(word)) score++; });
        return { ...row, score };
      }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        const best = scored[0];
        const knowledge = JSON.parse(best.value);
        leagueKnowledgeBlock = `
## KIẾN THỨC GIẢI ĐẤU (Siêu Máy Tính đã học & tổng hợp):
- **Bản sắc chiến thuật**: ${knowledge.leagueIdentity || ''}
- **Nhịp độ trung bình**: ${knowledge.averageTempo || ''}
- **Xu hướng chiến thuật nổi bật**:
${(knowledge.tacticalTrends || []).map((t: string) => `  • ${t}`).join('\n')}
- **Kiểu cầu thủ đặc trưng**: ${knowledge.archetypalPlayers || ''}

Hãy sử dụng kiến thức trên để làm sâu sắc thêm phân tích của bạn về trận đấu này.`;
      }
    } catch {}

    // Context tối thiểu cho AI — chỉ đủ để viết phân tích chiến thuật
    const matchContext = {
      status: matchData?.status,
      live_clock: matchData?.liveClock,
      current_score: isLive ? `${matchData?.score1 ?? 0} - ${matchData?.score2 ?? 0}` : 'Chưa đá',
      live_period: matchData?.livePeriod,
      live_statistics: matchData?.statistics,
      lineups: matchData?.lineups,
      events: isLive ? (matchData?.events || []).slice(0, 10) : [],
      // Số liệu đã tính sẵn bởi engine (AI không cần tính lại)
      engine_metrics: {
        probabilities: engineResult.probabilities,
        xG: engineResult.xG,
        expected_goals_ou: engineResult.xGoals,
        elo: engineResult.elo,
        team1_form: engineResult.team1Form,
        team2_form: engineResult.team2Form,
        h2h_summary: {
          total: engineResult.h2hData.total,
          team1Wins: engineResult.h2hData.team1Wins,
          draws: engineResult.h2hData.draws,
          team2Wins: engineResult.h2hData.team2Wins,
        },
      },
    };



    // ── Prompt tối giản: AI CHỈ viết analysisHtml + sources ──
    const systemPrompt = `Bạn là chuyên gia bình luận bóng đá hàng đầu thế giới, viết cho tạp chí The Athletic.

NHIỆM VỤ DUY NHẤT: Viết bài phân tích chiến thuật chuyên sâu bằng tiếng Việt cho trận đấu: "${title}".

${aiTacticalTrainingGuide}
${leagueKnowledgeBlock}

THÔNG TIN TRẬN ĐẤU:
${JSON.stringify(matchContext, null, 2)}

QUY TẮC QUAN TRỌNG:
- Tất cả số liệu (tỉ lệ %, xG, thẻ, phạt góc) đã được tính sẵn bởi hệ thống engine. KHÔNG ĐƯỢC thay đổi các con số này.
- Chỉ viết phần analysisHtml (HTML tiếng Việt chuyên sâu) và sources.
- analysisHtml phải có ít nhất 4 mục: (1) Nhận định tổng quan, (2) Chiến thuật & Đội hình, (3) Điểm mạnh/yếu từng đội, (4) Kịch bản diễn biến dự kiến.
- Nếu trận đang live: phân tích thêm diễn biến hiệp 2, tác động của tỉ số hiện tại lên chiến thuật.
- Văn phong: chuyên nghiệp, sâu sắc, có số liệu cụ thể, không nói chung chung.

ĐẦU RA: JSON hợp lệ, KHÔNG có markdown wrapper:
{
  "analysisHtml": "<h3>1. Tổng quan</h3><p>...</p><h3>2. Chiến thuật...</h3><p>...</p>",
  "sources": [
    { "title": "Tiêu đề tiếng Việt", "url": "https://...", "siteName": "Tên nguồn" }
  ]
}`;

    let contentText = '{}';
    try {
      contentText = await generateWithFallback(
        systemPrompt,
        'You are a concise JSON generation assistant.',
        true
      );
    } catch (err: any) {
      return NextResponse.json({ error: `Có lỗi xảy ra khi tạo nhận định: ${err.message}` }, { status: 500 });
    }

    // Parse AI output (chỉ chứa analysisHtml + sources)
    let aiOutput: { analysisHtml?: string; sources?: any[] } = {};
    try {
      const parsed = JSON.parse(contentText);
      aiOutput = parsed.predictionData || parsed;
    } catch { aiOutput = {}; }

    // ── Ghép engine metrics + AI analysisHtml → computedPredictionData hoàn chỉnh ──
    const computedPredictionData = {
      header: {
        team1: { name: t1, logo: matchData?.team1?.logo || '' },
        team2: { name: t2, logo: matchData?.team2?.logo || '' },
        matchTime: `${matchData?.matchTime || ''}, ${matchData?.matchDate || ''}`,
        tournament: matchData?.category || '',
        probabilities: {
          team1: engineResult.probabilities.w1,
          draw:  engineResult.probabilities.draw,
          team2: engineResult.probabilities.w2,
        },
      },
      formAndH2h: {
        team1Form: engineResult.team1Form,
        team2Form: engineResult.team2Form,
        h2hData: engineResult.h2hData,
      },
      lineups: {
        team1Formation: matchData?.lineups?.[0]?.formation || '4-3-3',
        team2Formation: matchData?.lineups?.[1]?.formation || '4-2-3-1',
        missingPlayers: { team1: [], team2: [] },
      },
      advancedMetrics: {
        expectedGoals: {
          half1:     engineResult.xGoals.half1,
          half2:     engineResult.xGoals.half2,
          fullMatch: engineResult.xGoals.fullMatch,
        },
        expectedCards:   engineResult.expectedCards,
        expectedCorners: engineResult.expectedCorners,
      },
      analysisHtml: aiOutput.analysisHtml ||
        `<h3>Đang cập nhật phân tích...</h3><p>Trận ${t1} vs ${t2}.</p>`,
      sources: aiOutput.sources || [],
    };

    const result = { predictionData: computedPredictionData };

    // Ghi đè lại nếu trận live: dùng engine live probability
    if (isLive && matchData?.score1 != null) {
      // engineResult đã dùng pre-match Elo; probabilities đã correct
      // (live odds được tính real-time ở client, không cần ghi đè ở đây)
    }


    if (!previewOnly) {
      // Cache vào DB (chỉ cho trận chưa đá hoặc đã kết thúc)
      if (matchId && !isLive) {
        const cached = await prisma.fixtureCache.findUnique({ where: { id: matchId } });
        if (cached) {
          await prisma.fixtureCache.update({
            where: { id: matchId },
            data: { data: { ...(cached.data as any), prediction: result.predictionData } },
          });
        }
      }

      // Lưu milestone vào PredictionHistory
      if (matchId) {
        const milestone = body.milestone || (isLive ? 'LIVE' : 'PRE_MATCH');
        const scoreState = (matchData?.score1 != null && matchData?.score2 != null)
          ? `${matchData.score1}-${matchData.score2}` : '0-0';
        await prisma.predictionHistory.create({
          data: {
            matchId, milestone,
            prediction: result.predictionData as any,
            scoreState,
            liveTime: isLive ? (matchData?.liveClock || 'Đang đấu') : null,
            status: matchData?.status || 'Chưa diễn ra',
          },
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
