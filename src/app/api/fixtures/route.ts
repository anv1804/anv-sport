import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=f1f5f9&color=64748b&bold=true&font-size=0.4`;
};

const LEAGUES = [
  { id: 'uefa.champions', name: 'UEFA Champions League' },
  { id: 'eng.1', name: 'English Premier League' },
  { id: 'esp.1', name: 'La Liga' },
  { id: 'ita.1', name: 'Serie A' },
  { id: 'ger.1', name: 'Bundesliga' },
  { id: 'fra.1', name: 'Ligue 1' }
];

const vleagueDetails: Record<string, any> = {
  "vleague-1": {
    id: "vleague-1",
    team1: { name: "Hà Nội FC", logo: "https://upload.wikimedia.org/wikipedia/vi/e/eb/Ha_Noi_FC_2016_logo.svg" },
    team2: { name: "Hải Phòng FC", logo: "https://upload.wikimedia.org/wikipedia/vi/2/20/Logo_Hai_Phong_FC.png" },
    category: "V-League 1",
    matchDate: new Date().toLocaleDateString('vi-VN'),
    matchTime: "19:15",
    status: "Chưa đá",
    score1: "0",
    score2: "0",
    ground: "Sân vận động Hàng Đẫy",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    statistics: [],
    lineups: [
      {
        team: { name: "Hà Nội FC" },
        formation: "4-3-3",
        startXI: [
          { player: { number: 37, name: "Quan Văn Chuẩn", pos: "G" } },
          { player: { number: 2, name: "Đỗ Duy Mạnh", pos: "D" } },
          { player: { number: 16, name: "Nguyễn Thành Chung", pos: "D" } },
          { player: { number: 15, name: "Phạm Xuân Mạnh", pos: "D" } },
          { player: { number: 26, name: "Đào Văn Nam", pos: "D" } },
          { player: { number: 8, name: "Đỗ Hùng Dũng", pos: "M" } },
          { player: { number: 10, name: "Nguyễn Văn Quyết", pos: "M" } },
          { player: { number: 19, name: "Hai Long", pos: "M" } },
          { player: { number: 7, name: "Phạm Tuấn Hải", pos: "F" } },
          { player: { number: 9, name: "Denílson", pos: "F" } },
          { player: { number: 14, name: "Tagueu", pos: "F" } }
        ],
        substitutes: [
          { player: { number: 1, name: "Bùi Tấn Trường", pos: "G" } },
          { player: { number: 5, name: "Đậu Văn Toàn", pos: "M" } },
          { player: { number: 23, name: "Nguyễn Quang Hải", pos: "M" } }
        ],
        coach: { name: "Daiki Iwamasa" }
      },
      {
        team: { name: "Hải Phòng FC" },
        formation: "4-2-3-1",
        startXI: [
          { player: { number: 26, name: "Nguyễn Văn Toản", pos: "G" } },
          { player: { number: 3, name: "Phạm Hoài Dương", pos: "D" } },
          { player: { number: 4, name: "Bicou Bissainthe", pos: "D" } },
          { player: { number: 5, name: "Đặng Văn Tới", pos: "D" } },
          { player: { number: 20, name: "Dương Văn Khoa", pos: "D" } },
          { player: { number: 6, name: "Lương Xuân Trường", pos: "M" } },
          { player: { number: 97, name: "Triệu Việt Hưng", pos: "M" } },
          { player: { number: 14, name: "Nguyễn Hải Huy", pos: "M" } },
          { player: { number: 7, name: "Lâm Ti Phông", pos: "F" } },
          { player: { number: 10, name: "Mpande", pos: "F" } },
          { player: { number: 9, name: "Lucão", pos: "F" } }
        ],
        substitutes: [
          { player: { number: 1, name: "Nguyễn Đình Triệu", pos: "G" } },
          { player: { number: 8, name: "Martin Lò", pos: "M" } }
        ],
        coach: { name: "Chu Đình Nghiêm" }
      }
    ],
    events: []
  },
  "vleague-2": {
    id: "vleague-2",
    team1: { name: "Thép Xanh Nam Định", logo: "https://upload.wikimedia.org/wikipedia/vi/a/a2/Logo_Th%C3%A9p_Xanh_Nam_%C4%90%E1%BB%8Bnh.png" },
    team2: { name: "Công An Hà Nội", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Logo_Cong_An_Ha_Noi_FC.png" },
    category: "V-League 1",
    matchDate: new Date().toLocaleDateString('vi-VN'),
    matchTime: "18:00",
    status: "Chưa đá",
    score1: "0",
    score2: "0",
    ground: "Sân vận động Thiên Trường",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    statistics: [],
    lineups: [],
    events: []
  },
  "vleague-3": {
    id: "vleague-3",
    team1: { name: "Đông Á Thanh Hóa", logo: "https://upload.wikimedia.org/wikipedia/vi/a/a5/Logo_Dong_A_Thanh_Hoa_FC.png" },
    team2: { name: "Becamex Bình Dương", logo: "https://upload.wikimedia.org/wikipedia/vi/8/87/Logo_Becamex_Binh_Duong_FC.svg" },
    category: "V-League 1",
    matchDate: new Date(Date.now() - 86400000).toLocaleDateString('vi-VN'),
    matchTime: "18:00",
    status: "Kết thúc",
    score1: "2",
    score2: "1",
    ground: "Sân vận động Thanh Hóa",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    statistics: [
      {
        team: { name: "Đông Á Thanh Hóa" },
        statistics: [
          { type: "Ball Possession", value: "52%" },
          { type: "Total Shots", value: "14" },
          { type: "Fouls", value: "12" },
          { type: "Yellow Cards", value: "2" }
        ]
      },
      {
        team: { name: "Becamex Bình Dương" },
        statistics: [
          { type: "Ball Possession", value: "48%" },
          { type: "Total Shots", value: "9" },
          { type: "Fouls", value: "15" },
          { type: "Yellow Cards", value: "3" }
        ]
      }
    ],
    lineups: [
      {
        team: { name: "Đông Á Thanh Hóa" },
        formation: "4-3-3",
        startXI: [
          { player: { number: 25, name: "Nguyễn Thanh Diệp", pos: "G" } },
          { player: { number: 4, name: "Gustavo Santos", pos: "D" } },
          { player: { number: 15, name: "Trịnh Văn Lợi", pos: "D" } },
          { player: { number: 3, name: "Trần Đình Hằng", pos: "D" } },
          { player: { number: 28, name: "Hoàng Thái Bình", pos: "D" } },
          { player: { number: 12, name: "Nguyễn Thái Sơn", pos: "M" } },
          { player: { number: 19, name: "Lê Quốc Phương", pos: "M" } },
          { player: { number: 7, name: "Nguyễn Hữu Dũng", pos: "M" } },
          { player: { number: 10, name: "Lê Văn Thắng", pos: "F" } },
          { player: { number: 20, name: "Rimario Gordon", pos: "F" } },
          { player: { number: 11, name: "Lâm Ti Phông", pos: "F" } }
        ],
        substitutes: [],
        coach: { name: "Velizar Popov" }
      },
      {
        team: { name: "Becamex Bình Dương" },
        formation: "4-4-2",
        startXI: [
          { player: { number: 1, name: "Trần Minh Toàn", pos: "G" } },
          { player: { number: 3, name: "Quế Ngọc Hải", pos: "D" } },
          { player: { number: 4, name: "Janclesio", pos: "D" } },
          { player: { number: 16, name: "Nguyễn Minh Tùng", pos: "D" } },
          { player: { number: 68, name: "Bùi Duy Thường", pos: "D" } },
          { player: { number: 14, name: "Nguyễn Hải Huy", pos: "M" } },
          { player: { number: 8, name: "Moses Oloya", pos: "M" } },
          { player: { number: 11, name: "Vĩ Hào", pos: "M" } },
          { player: { number: 77, name: "Sỹ Giáp", pos: "M" } },
          { player: { number: 9, name: "Nguyễn Tiến Linh", pos: "F" } },
          { player: { number: 10, name: "Ibafaye", pos: "F" } }
        ],
        substitutes: [],
        coach: { name: "Lê Huỳnh Đức" }
      }
    ],
    events: [
      {
        type: "Goal",
        time: { elapsed: 24 },
        team: { name: "Đông Á Thanh Hóa" },
        player: { name: "Rimario Gordon" },
        detail: "Normal Goal"
      },
      {
        type: "Goal",
        time: { elapsed: 45 },
        team: { name: "Becamex Bình Dương" },
        player: { name: "Nguyễn Tiến Linh" },
        detail: "Normal Goal"
      },
      {
        type: "Goal",
        time: { elapsed: 78 },
        team: { name: "Đông Á Thanh Hóa" },
        player: { name: "Lê Văn Thắng" },
        detail: "Normal Goal"
      }
    ]
  }
};

const vleagueFixturesList = Object.values(vleagueDetails).map(d => ({
  id: d.id,
  team1: d.team1,
  team2: d.team2,
  category: d.category,
  matchDate: d.matchDate,
  matchTime: d.matchTime,
  status: d.status,
  score1: d.score1,
  score2: d.score2,
  ground: d.ground,
  video: d.video
}));

// Resolve wc2026-X match to real ESPN Event ID by querying scoreboard on that date
async function findEspnEventId(team1Name: string, team2Name: string, dateStr: string): Promise<string | null> {
  try {
    const cleanName = (n: string) => {
      return n.toLowerCase()
        .replace(/[\s\-\.&]/g, '')
        .replace('unitedstates', 'usa')
        .replace('czechrepublic', 'czechia')
        .replace('türkiye', 'turkey')
        .replace('drcongo', 'congodr')
        .replace('democraticrepublicofcongo', 'congodr')
        .replace('ivorycoast', 'cotedivoire')
        .replace('côted\'ivoire', 'cotedivoire')
        .replace('bosniaherzegovina', 'bosnia');
    };

    const t1Clean = cleanName(team1Name);
    const t2Clean = cleanName(team2Name);

    const parsedDate = new Date(dateStr);
    const datesToCheck: string[] = [];
    
    for (let offset = -1; offset <= 1; offset++) {
      const d = new Date(parsedDate);
      d.setDate(d.getDate() + offset);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      datesToCheck.push(`${yyyy}${mm}${dd}`);
    }

    for (const dateParam of datesToCheck) {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateParam}`, { next: { revalidate: 3600 } });
        if (!res.ok) continue;
        const data = await res.json();
        if (!data.events) continue;

        for (const event of data.events) {
          const competitors = event.competitions?.[0]?.competitors;
          if (!competitors || competitors.length !== 2) continue;

          const homeName = competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
          const awayName = competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';

          const hClean = cleanName(homeName);
          const aClean = cleanName(awayName);

          const match1 = hClean.includes(t1Clean) || t1Clean.includes(hClean);
          const match2 = aClean.includes(t2Clean) || t2Clean.includes(aClean);
          const match3 = hClean.includes(t2Clean) || t2Clean.includes(hClean);
          const match4 = aClean.includes(t1Clean) || t1Clean.includes(aClean);

          if ((match1 && match2) || (match3 && match4)) {
            return event.id;
          }
        }
      } catch (err) {
        // ignore date error and try next
      }
    }
  } catch (err) {
    console.error("Lỗi khi ánh xạ trận đấu sang ESPN:", err);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let matchId = searchParams.get('id');
    const apiKey = process.env.API_FOOTBALL_KEY;

    // 1. NẾU CÓ API KEY: Sử dụng API-Football
    if (apiKey && apiKey.trim() !== "") {
      const headers = { 'x-apisports-key': apiKey };

      if (matchId) {
        const cachedFixture = await prisma.fixtureCache.findUnique({ where: { id: matchId } });
        if (cachedFixture && ["FT", "PEN", "AWD"].includes(cachedFixture.status)) {
          return NextResponse.json({ success: true, data: cachedFixture.data });
        }
        if (cachedFixture) {
          const diffMins = (new Date().getTime() - new Date(cachedFixture.lastUpdated).getTime()) / 60000;
          const isLive = cachedFixture.data && (
            (cachedFixture.data as any).status === "Đang đá" ||
            !["FT", "PEN", "AWD", "PST", "CANC"].includes(cachedFixture.status)
          );
          const cacheLimit = isLive ? (10 / 60) : 5;
          if (diffMins < cacheLimit) return NextResponse.json({ success: true, data: cachedFixture.data });
        }

        const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${matchId}`, { headers, next: { revalidate: 0 } });
        const data = await res.json();
        
        if (!data.response || data.response.length === 0) {
          return NextResponse.json({ success: false, error: "Không tìm thấy trận đấu trên API-Football" }, { status: 404 });
        }

        const match = data.response[0];
        const isFinished = match.fixture.status.short === 'FT' || match.fixture.status.short === 'PEN';

        const elapsed = match.fixture.status.elapsed;
        const statusShort = match.fixture.status.short;
        let liveClock = elapsed ? `${elapsed}'` : null;
        let livePeriod = null;
        if (statusShort === '1H') {
          livePeriod = "Hiệp 1";
        } else if (statusShort === '2H') {
          livePeriod = "Hiệp 2";
        } else if (statusShort === 'HT') {
          liveClock = "HT";
          livePeriod = "Nghỉ giữa hiệp";
        } else if (statusShort === 'ET') {
          livePeriod = "Hiệp phụ";
        }

        const detail = {
          id: match.fixture.id.toString(),
          team1: { name: match.teams.home.name, logo: match.teams.home.logo },
          team2: { name: match.teams.away.name, logo: match.teams.away.logo },
          category: `${match.league.name} - ${match.league.round}`,
          matchDate: new Date(match.fixture.date).toLocaleDateString('vi-VN'),
          matchTime: new Date(match.fixture.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          status: isFinished ? "Kết thúc" : (match.fixture.status.short === 'NS' ? "Chưa đá" : "Đang đá"),
          score1: match.goals.home,
          score2: match.goals.away,
          liveClock,
          livePeriod,
          ground: match.fixture.venue.name || "Chưa xác định",
          goals: { home: "", away: "" },
          video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          statistics: match.statistics || [],
          lineups: match.lineups || [],
          events: match.events || []
        };

        await prisma.fixtureCache.upsert({
          where: { id: matchId },
          update: { data: detail, status: match.fixture.status.short, lastUpdated: new Date() },
          create: { id: matchId, data: detail, status: match.fixture.status.short }
        });

        return NextResponse.json({ success: true, data: detail });
      } else {
        const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=4&season=2024`, { headers, next: { revalidate: 3600 } });
        const data = await res.json();

        if (!data.response) {
           return NextResponse.json({ success: false, error: "Lỗi kết nối API-Football" }, { status: 500 });
        }

        const formattedFixtures = data.response.map((match: any) => {
          const isFinished = match.fixture.status.short === 'FT' || match.fixture.status.short === 'PEN';
          return {
            id: match.fixture.id.toString(),
            team1: { name: match.teams.home.name, logo: match.teams.home.logo },
            team2: { name: match.teams.away.name, logo: match.teams.away.logo },
            category: `${match.league.name} - ${match.league.round}`,
            matchDate: new Date(match.fixture.date).toLocaleDateString('vi-VN'),
            matchTime: new Date(match.fixture.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            status: isFinished ? "Kết thúc" : (match.fixture.status.short === 'NS' ? "Chưa đá" : "Đang đá"),
            score1: match.goals.home,
            score2: match.goals.away,
            ground: match.fixture.venue.name || "Chưa xác định",
            video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          };
        });

        return NextResponse.json({ success: true, data: formattedFixtures });
      }
    }

    // 2. NẾU CHƯA CÓ API KEY: Sử dụng ESPN Hidden API & OpenFootball World Cup
    if (matchId) {
      if (matchId.startsWith('vleague-')) {
        const detail = vleagueDetails[matchId];
        if (!detail) {
          return NextResponse.json({ success: false, error: "Không tìm thấy trận đấu V-League" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: detail });
      }

      // --- DATABASE CACHING LAYER FOR DETAIL ---
      const cachedFixture = await prisma.fixtureCache.findUnique({ where: { id: matchId } });
      if (cachedFixture && ["FT", "PEN", "AWD", "post", "STATUS_FULL_TIME", "STATUS_FINAL"].includes(cachedFixture.status)) {
        return NextResponse.json({ success: true, data: cachedFixture.data });
      }
      if (cachedFixture) {
        const diffMins = (new Date().getTime() - new Date(cachedFixture.lastUpdated).getTime()) / 60000;
        const isLive = cachedFixture.data && (
          (cachedFixture.data as any).status === "Đang đá" ||
          !["FT", "PEN", "AWD", "post", "STATUS_FULL_TIME", "STATUS_FINAL", "STATUS_POSTPONED", "STATUS_CANCELED"].includes(cachedFixture.status)
        );
        const cacheLimit = isLive ? (1 / 60) : (10 / 60); // 1 second cache for live matches, 10 seconds for others
        if (diffMins < cacheLimit) return NextResponse.json({ success: true, data: cachedFixture.data });
      }

      let espnEventId = matchId;

      // NẾU LÀ TRẬN ĐẤU WORLD CUP (wc2026-X): Ánh xạ sang ESPN Event ID thật dựa vào Ngày & Cặp đấu
      if (matchId.startsWith('wc2026-')) {
        const index = parseInt(matchId.split('-')[1]);
        const openRes = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json', { next: { revalidate: 3600 } });
        const openData = await openRes.json();
        const openMatch = openData.matches?.[index];

        if (openMatch) {
          const matchedId = await findEspnEventId(openMatch.team1, openMatch.team2, openMatch.date);
          if (matchedId) {
            espnEventId = matchedId;
          }
        }
      }

      // Lấy chi tiết trận đấu từ ESPN Summary API (Dùng eng.1 làm đường dẫn chung vì ESPN tự định tuyến bằng eventId)
      const espnRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${espnEventId}`, { next: { revalidate: 0 } });
      const espnData = await espnRes.json();

      if (!espnData || !espnData.header) {
        return NextResponse.json({ success: false, error: "Không tìm thấy trận đấu trên ESPN" }, { status: 404 });
      }

      const isFinished = espnData.header.competitions[0].status.type.state === 'post';
      const statusText = isFinished ? "Kết thúc" : (espnData.header.competitions[0].status.type.state === 'pre' ? "Chưa đá" : "Đang đá");

      const leagueName = espnData.header.league?.name || "Giải đấu khác";
      const seasonYear = espnData.header.season?.year || new Date(espnData.header.competitions[0].date).getFullYear();

      const homeComp = espnData.header.competitions[0].competitors.find((c:any)=>c.homeAway==='home');
      const awayComp = espnData.header.competitions[0].competitors.find((c:any)=>c.homeAway==='away');
      const penScore1 = homeComp.shootoutScore !== undefined ? String(homeComp.shootoutScore) : null;
      const penScore2 = awayComp.shootoutScore !== undefined ? String(awayComp.shootoutScore) : null;

      const comp = espnData.header.competitions[0];
      let stageName = "";
      if (comp.altGameNote) {
        stageName = comp.altGameNote;
      } else if (comp.groups?.name) {
        stageName = comp.groups.name;
      } else if (comp.competitors?.[0]?.team?.groups?.name) {
        stageName = comp.competitors[0].team.groups.name;
      }
      
      const stageTranslations: Record<string, string> = {
        "Final": "Chung kết",
        "Semi-finals": "Bán kết",
        "Quarter-finals": "Tứ kết",
        "Round of 16": "Vòng 16 đội",
        "Round of 32": "Vòng 32 đội",
        "Group Stage": "Vòng bảng",
        "Group A": "Vòng bảng - Bảng A",
        "Group B": "Vòng bảng - Bảng B",
        "Group C": "Vòng bảng - Bảng C",
        "Group D": "Vòng bảng - Bảng D",
        "Group E": "Vòng bảng - Bảng E",
        "Group F": "Vòng bảng - Bảng F",
        "Group G": "Vòng bảng - Bảng G",
        "Group H": "Vòng bảng - Bảng H",
        "Group I": "Vòng bảng - Bảng I",
        "Group J": "Vòng bảng - Bảng J",
        "Group K": "Vòng bảng - Bảng K",
        "Group L": "Vòng bảng - Bảng L"
      };
      
      let roundText = stageTranslations[stageName] || stageName;
      if (roundText.includes(", ")) {
        const parts = roundText.split(", ");
        const lastPart = parts[parts.length - 1];
        roundText = stageTranslations[lastPart] || lastPart;
      }

      const espnStatus = espnData.header.competitions[0].status;
      const displayClock = espnStatus.displayClock || espnStatus.type?.detail || espnStatus.type?.shortDetail || "";
      const period = espnStatus.period;
      const description = espnStatus.type?.description || "";
      
      let liveClock = displayClock;
      let livePeriod = "";
      if (description.toLowerCase().includes("halftime") || description.toLowerCase().includes("half-time") || displayClock === "HT") {
        liveClock = "HT";
        livePeriod = "Nghỉ giữa hiệp";
      } else if (period === 1) {
        livePeriod = "Hiệp 1";
      } else if (period === 2) {
        livePeriod = "Hiệp 2";
      } else if (period === 3) {
        livePeriod = "Hiệp phụ 1";
      } else if (period === 4) {
        livePeriod = "Hiệp phụ 2";
      } else if (description) {
        livePeriod = description;
      }

      const detail = {
        id: matchId, // Giữ nguyên ID gốc (wc2026-X) để frontend tương thích
        team1: { 
          name: homeComp.team.displayName, 
          logo: homeComp.team.logos?.[0]?.href || getFlagUrl(homeComp.team.displayName) 
        },
        team2: { 
          name: awayComp.team.displayName, 
          logo: awayComp.team.logos?.[0]?.href || getFlagUrl(awayComp.team.displayName) 
        },
        category: `${leagueName} - ${seasonYear}`,
        round: roundText,
        matchDate: new Date(espnData.header.competitions[0].date).toLocaleDateString('vi-VN'),
        matchTime: new Date(espnData.header.competitions[0].date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        status: statusText,
        score1: homeComp.score || "0",
        score2: awayComp.score || "0",
        liveClock: espnStatus.type?.state === 'in' ? liveClock : null,
        livePeriod: espnStatus.type?.state === 'in' ? livePeriod : null,
        penScore1,
        penScore2,
        ground: espnData.gameInfo?.venue?.fullName || "Chưa xác định",
        goals: { home: "", away: "" },
        video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        statistics: [] as any[],
        lineups: [] as any[],
        events: [] as any[],
        headToHeadGames: espnData.headToHeadGames || null,
        lastFiveGames: espnData.lastFiveGames || null
      };

      // 1. Map Real Statistics from ESPN
      if (espnData.boxscore && espnData.boxscore.teams) {
         const statMapping: Record<string, string> = {
           "possessionPct": "Ball Possession",
           "totalShots": "Total Shots",
           "shotsOnTarget": "Shots on Goal",
           "wonCorners": "Corner Kicks",
           "offsides": "Offsides",
           "foulsCommitted": "Fouls",
           "yellowCards": "Yellow Cards",
           "redCards": "Red Cards",
           "totalPasses": "Total passes",
           "accuratePasses": "Passes accurate",
           "passPct": "Passes %",
           "blockedShots": "Blocked Shots"
         };

         detail.statistics = espnData.boxscore.teams.map((t: any) => {
           const teamStats = (t.statistics || []).map((s: any) => {
             const type = statMapping[s.name] || s.label;
             let value = s.displayValue;
             if (s.name === 'possessionPct') {
               value = `${s.displayValue}%`;
             } else if (s.name === 'passPct' || s.name?.toLowerCase().includes('pct') || s.label?.includes('%') || type?.includes('%')) {
               const num = parseFloat(s.displayValue);
               value = !isNaN(num) ? `${Math.round(num <= 1 ? num * 100 : num)}%` : s.displayValue;
             }
             return { type, value };
           });
           return {
             team: { name: t.team.displayName, logo: t.team.logo },
             statistics: teamStats
           };
         });
      }

      // 2. Map Real Lineups from ESPN
      if (espnData.rosters && espnData.rosters.length === 2) {
        const mappedLineups = [];
        for (const rosterItem of espnData.rosters) {
          const playerNames = (rosterItem.roster || [])
            .map((p: any) => p.athlete?.displayName)
            .filter(Boolean);
            
          const dbPlayers = await prisma.entity.findMany({
            where: {
              type: "FOOTBALL_PLAYER",
              name: { in: playerNames }
            }
          });
          const playerDbMap = new Map(dbPlayers.map(p => [p.name.toLowerCase(), p]));
          
          const startXI = (rosterItem.roster || [])
            .filter((p: any) => p.starter)
            .map((p: any) => {
              const dbPlayer = playerDbMap.get(p.athlete?.displayName?.toLowerCase());
              return {
                player: {
                  number: p.jersey || "",
                  name: p.athlete?.displayName || "",
                  pos: p.position?.abbreviation || "M",
                  avatar: dbPlayer?.avatar || null,
                  slug: dbPlayer?.slug || null
                }
              };
            });
            
          const substitutes = (rosterItem.roster || [])
            .filter((p: any) => !p.starter)
            .map((p: any) => {
              const dbPlayer = playerDbMap.get(p.athlete?.displayName?.toLowerCase());
              return {
                player: {
                  number: p.jersey || "",
                  name: p.athlete?.displayName || "",
                  pos: p.position?.abbreviation || "M",
                  avatar: dbPlayer?.avatar || null,
                  slug: dbPlayer?.slug || null
                }
              };
            });
            
          mappedLineups.push({
            team: { name: rosterItem.team?.displayName || "", logo: rosterItem.team?.logos?.[0]?.href || "" },
            formation: rosterItem.formation || "4-3-3",
            coach: { name: "HLV Trưởng" },
            startXI,
            substitutes
          });
        }
        detail.lineups = mappedLineups;
      }

      // 3. Map Real Events from ESPN
      if (espnData.keyEvents && espnData.keyEvents.length > 0) {
        detail.events = espnData.keyEvents.map((e: any) => {
          const typeText = e.type?.text || "";
          const typeType = e.type?.type || "";
          
          let type = "Goal";
          let detailType = e.type?.text || "Normal Goal";
          
          if (typeType.includes("substitution") || typeText.toLowerCase().includes("substitution")) {
            type = "subst";
            detailType = "Substitution";
          } else if (typeType.includes("card") || typeText.toLowerCase().includes("card")) {
            type = "Card";
            detailType = typeText.includes("Red") ? "Red Card" : "Yellow Card";
          } else if (
            typeType.includes("goal") || 
            typeText.toLowerCase().includes("goal") || 
            typeType.includes("penalty") || 
            typeText.toLowerCase().includes("penalty") ||
            typeType.includes("own-goal") ||
            typeText.toLowerCase().includes("own goal")
          ) {
            type = "Goal";
            const isPen = typeType.includes("penalty") || typeText.toLowerCase().includes("penalty");
            const isOG = typeType.includes("own-goal") || typeText.toLowerCase().includes("own goal");
            detailType = isPen ? "Penalty" : (isOG ? "Own Goal" : "Normal Goal");
          } else {
            return null;
          }

          const elapsedStr = e.clock?.displayValue ? e.clock.displayValue.replace(/'/g, "") : "0";
          let elapsed = 0;
          if (elapsedStr.includes("+")) {
            elapsed = elapsedStr.split("+").map((s: string) => Number(s.trim())).reduce((a: number, b: number) => a + b, 0);
          } else {
            elapsed = parseInt(elapsedStr) || 0;
          }
          
          return {
            time: { elapsed: elapsed, extra: null },
            team: { name: e.team?.displayName || "" },
            player: { name: e.participants?.[0]?.athlete?.displayName || "" },
            assist: e.participants?.[1] ? { name: e.participants[1].athlete?.displayName || "" } : null,
            type: type,
            detail: detailType
          };
        }).filter(Boolean);
      }

      // 4. Fill Goals text for Scorers overview
      if (detail.events && detail.events.length > 0) {
        const homeScorers: string[] = [];
        const awayScorers: string[] = [];
        detail.events.forEach((evt: any) => {
          if (evt.type === "Goal") {
            const suffix = evt.detail === "Penalty" ? " (P)" : (evt.detail === "Own Goal" ? " (OG)" : "");
            const scorerStr = `${evt.player.name} ${evt.time.elapsed}'${suffix}`;
            if (evt.team.name === detail.team1.name) {
              homeScorers.push(scorerStr);
            } else if (evt.team.name === detail.team2.name) {
              awayScorers.push(scorerStr);
            }
          }
        });
        detail.goals = {
          home: homeScorers.join("; "),
          away: awayScorers.join("; ")
        };
      }

      // Lưu cache
      await prisma.fixtureCache.upsert({
        where: { id: matchId },
        update: { data: detail, status: espnData.header.competitions[0].status.type.name, lastUpdated: new Date() },
        create: { id: matchId, data: detail, status: espnData.header.competitions[0].status.type.name }
      });

      return NextResponse.json({ success: true, data: detail });

    } else {
      // 2.2. Lấy danh sách trận đấu
      // A. World Cup 2026 từ OpenFootball (Tất cả 104 trận đấu để tạo Hub dữ liệu đẹp mắt)
      let worldCupFixtures: any[] = [];
      try {
        const res = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json', { next: { revalidate: 3600 } });
        const data = await res.json();
        const matchesList = data.matches || [];
        worldCupFixtures = matchesList.map((match: any, index: number) => {
          const id = `wc2026-${index}`;
          let vnDate = match.date;
          let vnTime = match.time ? match.time.split(' ')[0] : '00:00';
          
          if (match.time && match.time.includes('UTC')) {
            const gmtTimeStr = match.time.replace('UTC', 'GMT');
            const parsedDate = new Date(`${match.date} ${gmtTimeStr}`);
            if (!isNaN(parsedDate.getTime())) {
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
            score1: match.score?.ft ? match.score.ft[0].toString() : null,
            score2: match.score?.ft ? match.score.ft[1].toString() : null,
            ground: match.ground || "Chưa xác định",
            video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          };
        });
      } catch (err) {
        console.error("Lỗi khi load OpenFootball World Cup list:", err);
      }

      // B. Kéo các giải đấu quốc tế & quốc gia khác từ ESPN Scoreboard (Trực tiếp ngày hôm nay)
      const fetchPromises = LEAGUES.map(async (league) => {
        try {
          const espnRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league.id}/scoreboard`, { next: { revalidate: 0 } });
          if (!espnRes.ok) return [];
          const espnData = await espnRes.json();
          if (!espnData.events) return [];

          return espnData.events.map((match: any) => {
            const isFinished = match.status.type.state === 'post';
            const homeComp = match.competitions[0].competitors.find((c:any) => c.homeAway === 'home');
            const awayComp = match.competitions[0].competitors.find((c:any) => c.awayAway === 'away' || c.homeAway === 'away');

            return {
              id: match.id,
              team1: { name: homeComp.team.displayName, logo: homeComp.team.logo || getFlagUrl(homeComp.team.displayName) },
              team2: { name: awayComp.team.displayName, logo: awayComp.team.logo || getFlagUrl(awayComp.team.displayName) },
              category: `${espnData.leagues?.[0]?.name || league.name}`,
              matchDate: new Date(match.date).toLocaleDateString('vi-VN'),
              matchTime: new Date(match.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              status: isFinished ? "Kết thúc" : (match.status.type.state === 'pre' ? "Chưa đá" : "Đang đá"),
              score1: homeComp.score || "0",
              score2: awayComp.score || "0",
              ground: match.competitions[0].venue?.fullName || "Chưa xác định",
              video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            };
          });
        } catch (e) {
          console.error(`Lỗi khi fetch giải ${league.name}:`, e);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      const allFixtures = [...worldCupFixtures, ...results.flat(), ...vleagueFixturesList];

      return NextResponse.json({ success: true, data: allFixtures });
    }

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Lỗi kết nối API" }, { status: 500 });
  }
}
