import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/aiBox';
import prisma from '@/lib/prisma';

// Helper function to generate deterministic Head-to-Head history based on team names
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

// Helper function to generate deterministic form based on team name
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

export async function POST(req: Request) {
  try {
    const { title, matchData } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề trận đấu' }, { status: 400 });
    }

    const matchId = matchData?.id;
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

    // 2. Generate deterministic H2H and form
    const deterministicT1Form = getDeterministicForm(t1);
    const deterministicT2Form = getDeterministicForm(t2);
    const deterministicH2H = getDeterministicH2H(t1, t2);

    let additionalContext = "";
    if (matchData) {
      additionalContext = `
TRẠNG THÁI TRẬN ĐẤU HIỆN TẠI: ${matchData.status}. 
TỶ SỐ HIỆN TẠI: ${t1} ${matchData.score1} - ${matchData.score2} ${t2}.
${isLive ? 'LƯU Ý QUAN TRỌNG: Trận đấu đang diễn ra TRỰC TIẾP. Bạn phải phân tích diễn biến hiện tại, tỷ số hiện tại và đưa ra nhận định chiến thuật theo thời gian thực dựa trên các con số này.' : ''}

Dữ liệu tham khảo: ${JSON.stringify({
        score1: matchData.score1,
        score2: matchData.score2,
        status: matchData.status,
        statistics: matchData.statistics,
        lineups: matchData.lineups,
        events: matchData.events
      })}.
Dựa vào tỷ số hiện tại, trạng thái trận đấu, các thống kê chi tiết, đội hình và sự kiện thực tế ở trên, hãy đưa ra nhận định bóng đá cực kỳ chuyên sâu bám sát thực tế.

BẮT BUỘC điền phần "formAndH2h" khớp chính xác với dữ liệu sau:
- Phong độ Đội nhà (team1Form): ${JSON.stringify(deterministicT1Form)}
- Phong độ Đội khách (team2Form): ${JSON.stringify(deterministicT2Form)}
- Lịch sử đối đầu H2H (h2hData): ${JSON.stringify(deterministicH2H)}
`;
    }

    const systemPrompt = `Bạn là một chuyên gia phân tích bóng đá hàng đầu.
    Nhiệm vụ: Phân tích cực kỳ chi tiết trận đấu: "${title}".${additionalContext}
    Yêu cầu: Tổng hợp thông tin từ các trang báo uy tín và trả về ĐÚNG định dạng JSON sau (không chứa ký tự markdown \`\`\`json):

    {
      "predictionData": {
        "header": {
          "team1": { "name": "${t1}", "logo": "${matchData?.team1?.logo || ''}" },
          "team2": { "name": "${t2}", "logo": "${matchData?.team2?.logo || ''}" },
          "matchTime": "Thời gian thi đấu (VD: ${matchData?.matchTime || '02:00'}, ${matchData?.matchDate || '18/06/2026'})",
          "tournament": "${matchData?.category || 'Giải đấu khác'}",
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
          "totalGoals": "2.5 (Tài)",
          "cards": { "team1": 2, "team2": 3, "total": 5 },
          "corners": { "team1": 5, "team2": 4, "total": 9 }
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

    // Force override deterministic H2H and form values to guarantee 100% consistency across predictions
    if (result.predictionData) {
      if (!result.predictionData.formAndH2h) {
        result.predictionData.formAndH2h = {};
      }
      result.predictionData.formAndH2h.team1Form = deterministicT1Form;
      result.predictionData.formAndH2h.team2Form = deterministicT2Form;
      result.predictionData.formAndH2h.h2hData = deterministicH2H;

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
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Prediction Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Có lỗi xảy ra khi tạo nhận định' }, { status: 500 });
  }
}
