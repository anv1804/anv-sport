import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Bộ từ điển ánh xạ 100% 48 Đội tuyển Quốc Gia tham dự World Cup 2026
const getFlagUrl = (teamName: string) => {
  const mapping: Record<string, string> = {
    // 32 Đội từ các kỳ trước
    "Qatar": "QA", "Ecuador": "EC", "Senegal": "SN", "Netherlands": "NL",
    "England": "GB-ENG", "Iran": "IR", "USA": "US", "Wales": "GB-WLS",
    "Argentina": "AR", "Saudi Arabia": "SA", "Mexico": "MX", "Poland": "PL",
    "France": "FR", "Australia": "AU", "Denmark": "DK", "Tunisia": "TN",
    "Spain": "ES", "Costa Rica": "CR", "Germany": "DE", "Japan": "JP",
    "Belgium": "BE", "Canada": "CA", "Morocco": "MA", "Croatia": "HR",
    "Brazil": "BR", "Serbia": "RS", "Switzerland": "CH", "Cameroon": "CM",
    "Portugal": "PT", "Ghana": "GH", "Uruguay": "UY", "South Korea": "KR",
    // Các đội mới của kỳ 48 đội (World Cup 2026)
    "South Africa": "ZA", "Czech Republic": "CZ", "Bosnia & Herzegovina": "BA",
    "Haiti": "HT", "Scotland": "GB-SCT", "Paraguay": "PY", "Turkey": "TR",
    "Curaçao": "CW", "Ivory Coast": "CI", "Sweden": "SE", "Egypt": "EG",
    "New Zealand": "NZ", "Cape Verde": "CV", "Iraq": "IQ", "Norway": "NO",
    "Algeria": "DZ", "Austria": "AT", "Jordan": "JO", "DR Congo": "CD",
    "Uzbekistan": "UZ", "Colombia": "CO", "Panama": "PA"
  };
  
  const code = mapping[teamName];
  if (code) {
    return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  }
  // Fallback an toàn phòng khi tên đội bị sai lệch
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=f1f5f9&color=64748b&bold=true&font-size=0.4`;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');

    // Sử dụng đúng API OpenFootball chuyên trách cho World Cup 2026
    const response = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json', { next: { revalidate: 60 } });
    const data = await response.json();

    // Lọc bỏ các trận đấu giả định của vòng Knockout (W100, L102...) để giao diện đẹp
    const groupStageMatches = data.matches.filter((m: any) => m.group);

    const formattedFixtures = groupStageMatches.map((match: any, index: number) => {
      const id = `wc2026-${index}`;

      let vnDate = match.date;
      let vnTime = match.time ? match.time.split(' ')[0] : '00:00';
      
      if (match.time && match.time.includes('UTC')) {
        // Parse string like "2026-06-11 13:00 UTC-6" into valid JS GMT format
        const gmtTimeStr = match.time.replace('UTC', 'GMT');
        const parsedDate = new Date(`${match.date} ${gmtTimeStr}`);
        if (!isNaN(parsedDate.getTime())) {
          // Format as en-CA (YYYY-MM-DD) natively supported in modern Node/browsers
          vnDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsedDate);
          vnTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(parsedDate);
        }
      }

      return {
        id,
        team1: { name: match.team1, logo: getFlagUrl(match.team1) },
        team2: { name: match.team2, logo: getFlagUrl(match.team2) },
        category: `FIFA World Cup 2026 - ${match.group || match.round}`,
        matchDate: vnDate, 
        matchTime: vnTime,
        status: match.score?.ft ? "Kết thúc" : "Chưa đá",
        score1: match.score?.ft ? match.score.ft[0] : null,
        score2: match.score?.ft ? match.score.ft[1] : null,
        ground: match.ground || "Chưa xác định",
        goals: {
          home: match.goals1 ? match.goals1.map((g: any) => `${g.name} ${g.minute}'`).join("; ") : "",
          away: match.goals2 ? match.goals2.map((g: any) => `${g.name} ${g.minute}'`).join("; ") : ""
        },
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      };
    });

    if (matchId) {
      const detail = formattedFixtures.find((f: any) => f.id === matchId);
      if (detail) {
        // --- Bắt đầu: API-Football Mock Data ---
        // Giả lập dữ liệu siêu chi tiết của API-Football để xây dựng UI trước khi gắn API Key
        detail.statistics = [
          {
            team: { name: detail.team1.name, logo: detail.team1.logo },
            statistics: [
              { type: "Ball Possession", value: "58%" },
              { type: "Total Shots", value: 16 },
              { type: "Shots on Goal", value: 7 },
              { type: "Shots off Goal", value: 5 },
              { type: "Blocked Shots", value: 4 },
              { type: "Corner Kicks", value: 8 },
              { type: "Offsides", value: 2 },
              { type: "Fouls", value: 12 },
              { type: "Yellow Cards", value: 2 },
              { type: "Red Cards", value: null },
              { type: "Total passes", value: 540 },
              { type: "Passes accurate", value: 485 },
              { type: "Passes %", value: "90%" }
            ]
          },
          {
            team: { name: detail.team2.name, logo: detail.team2.logo },
            statistics: [
              { type: "Ball Possession", value: "42%" },
              { type: "Total Shots", value: 9 },
              { type: "Shots on Goal", value: 3 },
              { type: "Shots off Goal", value: 4 },
              { type: "Blocked Shots", value: 2 },
              { type: "Corner Kicks", value: 3 },
              { type: "Offsides", value: 1 },
              { type: "Fouls", value: 15 },
              { type: "Yellow Cards", value: 3 },
              { type: "Red Cards", value: 1 },
              { type: "Total passes", value: 380 },
              { type: "Passes accurate", value: 310 },
              { type: "Passes %", value: "82%" }
            ]
          }
        ];

        detail.lineups = [
          {
            team: { name: detail.team1.name, logo: detail.team1.logo },
            formation: "4-3-3",
            coach: { name: "HLV Đội Nhà" },
            startXI: [
              { player: { number: 1, name: "Thủ môn A", pos: "G" } },
              { player: { number: 2, name: "Hậu vệ B", pos: "D" } },
              { player: { number: 4, name: "Hậu vệ C", pos: "D" } },
              { player: { number: 5, name: "Hậu vệ D", pos: "D" } },
              { player: { number: 3, name: "Hậu vệ E", pos: "D" } },
              { player: { number: 6, name: "Tiền vệ F", pos: "M" } },
              { player: { number: 8, name: "Tiền vệ G", pos: "M" } },
              { player: { number: 10, name: "Tiền vệ H", pos: "M" } },
              { player: { number: 7, name: "Tiền đạo I", pos: "F" } },
              { player: { number: 9, name: "Tiền đạo J", pos: "F" } },
              { player: { number: 11, name: "Tiền đạo K", pos: "F" } }
            ],
            substitutes: [
              { player: { number: 12, name: "Dự bị L", pos: "G" } },
              { player: { number: 13, name: "Dự bị M", pos: "D" } },
              { player: { number: 14, name: "Dự bị N", pos: "M" } },
              { player: { number: 15, name: "Dự bị O", pos: "F" } }
            ]
          },
          {
            team: { name: detail.team2.name, logo: detail.team2.logo },
            formation: "4-2-3-1",
            coach: { name: "HLV Đội Khách" },
            startXI: [
              { player: { number: 99, name: "Thủ môn X", pos: "G" } },
              { player: { number: 22, name: "Hậu vệ Y", pos: "D" } },
              { player: { number: 23, name: "Hậu vệ Z", pos: "D" } },
              { player: { number: 24, name: "Hậu vệ W", pos: "D" } },
              { player: { number: 25, name: "Hậu vệ V", pos: "D" } },
              { player: { number: 66, name: "Tiền vệ U", pos: "M" } },
              { player: { number: 77, name: "Tiền vệ T", pos: "M" } },
              { player: { number: 88, name: "Tiền vệ S", pos: "M" } },
              { player: { number: 19, name: "Tiền đạo R", pos: "F" } },
              { player: { number: 20, name: "Tiền đạo Q", pos: "F" } },
              { player: { number: 21, name: "Tiền đạo P", pos: "F" } }
            ],
            substitutes: [
              { player: { number: 30, name: "Dự bị 1", pos: "M" } },
              { player: { number: 31, name: "Dự bị 2", pos: "F" } }
            ]
          }
        ];

        detail.events = [
          {
            time: { elapsed: 12, extra: null },
            team: { name: detail.team1.name, logo: detail.team1.logo },
            player: { name: "Tiền đạo J" },
            assist: { name: "Tiền vệ H" },
            type: "Goal",
            detail: "Normal Goal"
          },
          {
            time: { elapsed: 34, extra: null },
            team: { name: detail.team2.name, logo: detail.team2.logo },
            player: { name: "Hậu vệ Y" },
            type: "Card",
            detail: "Yellow Card"
          },
          {
            time: { elapsed: 45, extra: 2 },
            team: { name: detail.team2.name, logo: detail.team2.logo },
            player: { name: "Tiền đạo R" },
            assist: { name: null },
            type: "Goal",
            detail: "Penalty"
          },
          {
            time: { elapsed: 65, extra: null },
            team: { name: detail.team1.name, logo: detail.team1.logo },
            player: { name: "Dự bị O" },
            assist: { name: "Tiền đạo K" },
            type: "subst",
            detail: "Substitution 1"
          },
          {
            time: { elapsed: 78, extra: null },
            team: { name: detail.team1.name, logo: detail.team1.logo },
            player: { name: "Dự bị O" },
            assist: { name: "Tiền vệ G" },
            type: "Goal",
            detail: "Header"
          },
          {
            time: { elapsed: 89, extra: null },
            team: { name: detail.team2.name, logo: detail.team2.logo },
            player: { name: "Hậu vệ Y" },
            type: "Card",
            detail: "Red Card"
          }
        ];
        // --- Kết thúc: API-Football Mock Data ---

        return NextResponse.json({ success: true, data: detail });
      }
      return NextResponse.json({ success: false, error: "Không tìm thấy trận đấu" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: formattedFixtures });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Lỗi kết nối API World Cup 2026" }, { status: 500 });
  }
}
