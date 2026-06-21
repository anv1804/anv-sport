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

LƯU Ý VỀ TỔNG HỢP VÀ PHÂN TÍCH YẾU TỐ:
Bạn bắt buộc phải tổng hợp và liên kết chặt chẽ các thông tin sau để đưa ra kết quả phân tích:
1. Lịch sử đối đầu (H2H) và vị trí bảng xếp hạng hiện tại của hai đội.
2. Phong độ thi đấu gần đây của cả đội và phong độ nổi bật của các cầu thủ chủ chốt (stars).
3. Giá trị đội hình (squad value) để thấy sự chênh lệch chất lượng nhân sự.
4. Đội hình xuất phát & sơ đồ chiến thuật: Nếu matchData.lineups đã có đội hình chính thức công bố từ dữ liệu thật, bạn BẮT BUỘC sử dụng nó làm cơ sở nhận định chính xác. Nếu chưa có, bạn phải phân tích tình hình chấn thương/treo giò để TỰ DỰ ĐOÁN sơ đồ chiến thuật tối ưu nhất.
5. Phân tích lối chơi, điểm mạnh, điểm yếu chiến thuật, khả năng khắc chế lối đá lẫn nhau (matchups), tinh thần thi đấu của tập thể và mục tiêu cụ thể của từng đội ở trận đấu này (đua vô địch, trụ hạng, giữ sức, v.v.).

LƯU Ý VỀ CHỈ SỐ DỰ ĐOÁN CHUYÊN SÂU (advancedMetrics):
Bạn phải phân tích và tính toán tỉ mỉ, cẩn thận để đưa ra dự đoán Bàn thắng kỳ vọng (expectedGoals) theo cấu trúc đối tượng có 3 trường: "predicted" (số bàn thắng dự kiến, VD: "1 bàn", "2 bàn", "3 bàn"), "ouLine" (tỷ lệ kèo tài xỉu nhà cái, VD: "0.75", "1.5", "2.5"), và "ouPick" (lựa chọn Tài hoặc Xỉu, VD: "Tài", "Xỉu").
Số thẻ phạt (expectedCards) và Số phạt góc (expectedCorners) chia tách chi tiết theo Hiệp 1 (half1), Hiệp 2 (half2) và Cả trận (fullMatch) dựa trên phong độ, lối chơi của 2 đội. Tuyệt đối không được điền bừa bãi hay để trống. Các giá trị phải logic (ví dụ: Tổng hiệp 1 + Hiệp 2 phải tương thích với cả trận).


`;

      if (hasRealForm || hasRealH2H) {
        const realT1Form = parseRealForm(matchData.lastFiveGames, t1);
        const realT2Form = parseRealForm(matchData.lastFiveGames, t2);
        const realH2H = parseRealH2H(matchData.headToHeadGames, t1, t2);
        
        additionalContext += `
BẮT BUỘC điền phần "formAndH2h" khớp chính xác với dữ liệu thực tế sau:
${realT1Form ? `- Phong độ Đội nhà (team1Form): ${JSON.stringify(realT1Form)}` : ''}
${realT2Form ? `- Phong độ Đội khách (team2Form): ${JSON.stringify(realT2Form)}` : ''}
${realH2H ? `- Lịch sử đối đầu H2H (h2hData): ${JSON.stringify(realH2H)}` : ''}
`;
      } else {
        additionalContext += `
LƯU Ý VỀ ĐỘI BÓNG THỰC TẾ: Đây là trận đấu giữa các đội tuyển/câu lạc bộ thực tế (${t1} vs ${t2}). 
Bạn BẮT BUỘC phải dựa vào kiến thức lịch sử bóng đá thực tế của mình để điền thông số "formAndH2h" (phong độ gần đây và lịch sử đối đầu H2H) sao cho CHÍNH XÁC nhất theo lịch sử thực tế ngoài đời.
VÍ DỤ: Tây Ban Nha (Spain) chưa bao giờ thua Ả Rập Xê Út (Saudi Arabia) trong lịch sử bóng đá thực tế, nên phần H2H phải thể hiện đúng Tây Ban Nha thắng áp đảo hoặc hòa, Ả Rập Xê Út thắng 0. Tuyệt đối không được bịa thông số sai lệch lịch sử.
`;
      }
    }

    const systemPrompt = `Bạn là một chuyên gia phân tích bóng đá hàng đầu thế giới, sở hữu tư duy chiến thuật sâu sắc và nhạy bén về tỷ lệ kèo.
    Nhiệm vụ: Phân tích cực kỳ chi tiết và chuyên sâu trận đấu: "${title}".${additionalContext}
    
    YÊU CẦU PHÂN TÍCH CHIẾN THUẬT & DỮ LIỆU CHUYÊN SÂU (BẮT BUỘC):
    1. Tổng hợp dữ liệu đa nguồn từ các trang chuyên thể thao danh tiếng (như SofaScore, WhoScored, ESPN, The Athletic) kết hợp tham chiếu tỷ lệ kèo và biến động từ các nhà cái lớn/trang bet nước ngoài uy tín để đưa ra nhận định thực tế nhất.
    2. Phân tích chi tiết về sự khắc chế sơ đồ chiến thuật của hai đội (Tactical Counter-strategies/Matchups): Cách sơ đồ của hai đội triệt tiêu hoặc mở ra các không gian chơi bóng của nhau (ví dụ: cự ly tuyến giữa, cách đối phó với đội hình 3 trung vệ hoặc khối phòng ngự lùi sâu).
    3. Nhận định diễn biến thực tế trên sân (Match Flow/In-play Dynamics): Nhịp độ trận đấu, các giai đoạn chuyển trạng thái nhanh (Transition phase), xu hướng dâng cao kiểm soát bóng hay chủ động nhường sân phản công.
    4. Phân tích chi tiết xu hướng cầu thủ và vai trò cá nhân (Player Tendencies & Movements): Lối chạy chỗ của tiền đạo cánh nghịch chân (Inverted wingers), tầm hoạt động của tiền vệ con thoi (Box-to-box), hay các pha chồng biên của hậu vệ biên (Overlap/Underlap).

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
