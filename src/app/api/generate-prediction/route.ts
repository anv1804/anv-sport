import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/aiBox';

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề trận đấu' }, { status: 400 });
    }


    const systemPrompt = `Bạn là một chuyên gia phân tích bóng đá hàng đầu.
    Nhiệm vụ: Phân tích cực kỳ chi tiết trận đấu: "${title}".
    Yêu cầu: Tổng hợp thông tin từ các trang báo uy tín và trả về ĐÚNG định dạng JSON sau (không chứa ký tự markdown \`\`\`json):

    {
      "predictionData": {
        "header": {
          "team1": { "name": "Tên đội nhà", "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/150px-Real_Madrid_CF.svg.png" },
          "team2": { "name": "Tên đội khách", "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/150px-Manchester_City_FC_badge.svg.png" },
          "matchTime": "Thời gian thi đấu dự kiến (VD: 02:00, 18/06/2026)",
          "tournament": "Tên giải đấu",
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
          "team1Formation": "4-3-3",
          "team2Formation": "4-2-3-1",
          "missingPlayers": { "team1": ["Cầu thủ A (Chấn thương)"], "team2": [] }
        },
        "advancedMetrics": {
          "totalGoals": "2.5 (Tài)",
          "cards": { "team1": 2, "team2": 3, "total": 5 },
          "corners": { "team1": 5, "team2": 4, "total": 9 }
        },
        "analysisHtml": "<h3>1. Tình hình lực lượng</h3><p>Nội dung chi tiết...</p><h3>2. Chiến thuật</h3><p>Nội dung...</p>",
        "sources": [
          { "title": "Phân tích đội hình...", "url": "https://vnexpress.net/the-thao", "siteName": "VNExpress" },
          { "title": "Nhận định tỷ lệ...", "url": "https://thethao247.vn", "siteName": "Thể Thao 247" }
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
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Prediction Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Có lỗi xảy ra khi tạo nhận định' }, { status: 500 });
  }
}
