import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateWithFallback } from '@/lib/aiBox';
import { slugify } from '@/lib/helpers/url';
import { searchESPNPlayer, getESPNPlayerDetails, getESPNRecentMatches } from '@/lib/espn-api';
import { generateFallbackRatings } from '@/lib/sofascore-api';
import { getTransfermarktValue } from '@/lib/transfermarkt-api';
import { COUNTRIES } from '@/lib/constants';

// Extend global type to persist crawl progress across hot reloads in dev
declare global {
  var wikiCrawlProgress: {
    status: 'idle' | 'running' | 'completed' | 'failed';
    total: number;
    processed: number;
    currentName: string;
    results: any[];
    lang: string;
  } | undefined;
}

if (!global.wikiCrawlProgress) {
  global.wikiCrawlProgress = {
    status: 'idle',
    total: 0,
    processed: 0,
    currentName: '',
    results: [],
    lang: 'vi'
  };
}

function cleanClubName(name: string): string {
  if (!name) return '';
  let cleaned = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  const prefixesSuffixes = [
    '^Câu lạc bộ bóng đá ', '^Câu lạc bộ ', 
    '\\bF\\.C\\.\\b', '\\bFC\\b', '\\bA\\.F\\.C\\.\\b', '\\bAFC\\b', '\\bFootball Club\\b', '\\bFútbol Club\\b', '\\bFútbol Club\\b', '\\bClub de Fútbol\\b',
    '\\bS\\.r\\.l\\.\\b', '\\bs\\.r\\.l\\.\\b', '\\bS\\.R\\.L\\.\\b', '\\bSrl\\b',
    '\\bS\\.p\\.A\\.\\b', '\\bSpA\\b',
    '\\bA\\.S\\.\\b', '\\bS\\.S\\.\\b', '\\bU\\.S\\.\\b', '\\bSC\\b', '\\bS\\.C\\.\\b',
    '\\bAssociazione Sportiva\\b', '\\bSocietà Sportiva\\b', '\\bUnione Sportiva\\b', '\\bAssociazione Calcistica\\b',
    '\\bFußball-Club\\b', '\\bFußball Club\\b', '\\bFussballclub\\b', '\\b1\\.\\s*FC\\b', '\\b1\\.\\s*Fußball-Club\\b',
    '\\bSportverein\\b', '\\bTurn-\\s*und\\s*Sportverein\\b', '\\bDeutscher\\s*Sport-Club\\b', '\\bMeidericher\\s*Spielverein\\b', '\\bSpielvereinigung\\b', '\\bSport-Club\\b', '\\bVerein\\s*für\\s*Leibesübungen\\b',
    '\\be\\.\\s*V\\.\\b', '\\be\\.V\\.\\b',
    '\\bS\\.A\\.D\\.\\b',
    '\\bClub Atlético\\b', '\\bRacing Club\\b', '\\bUnión Deportiva\\b', '\\bBalompié\\b',
    '\\bDelfino\\b', '\\bCalcio\\b',
    '\\bVfL\\b', '\\bSV\\b', '\\bTSG\\b', '\\bFSV\\b', '\\bVfB\\b',
    '^1\\.\\s+', '\\b(?:18|19)\\d{2}\\b'
  ];
  const regex = new RegExp(`(${prefixesSuffixes.join('|')})`, 'ig');
  cleaned = cleaned.replace(regex, '').trim();
  cleaned = cleaned.replace(/Mühlburg-Phönix/ig, '').trim();
  cleaned = cleaned.replace(/\s+von\s*$/i, '').trim();
  cleaned = cleaned.replace(/,\s*$/, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  return cleaned;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

function cleanPlayerName(name: string): string {
  if (!name) return '';
  const cleaned = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  return decodeHtmlEntities(cleaned);
}

function cleanStringForComparison(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ');
}

function mapCountryToCode(country: string): string {
  if (!country) return 'VIE';
  const trimmed = country.trim();
  if (trimmed.length === 3) return trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();
  const map: Record<string, string> = {
    'vietnam': 'VIE', 'việt nam': 'VIE',
    'england': 'ENG', 'anh': 'ENG',
    'france': 'FRA', 'pháp': 'FRA',
    'germany': 'GER', 'đức': 'GER',
    'spain': 'ESP', 'tây ban nha': 'ESP',
    'italy': 'ITA', 'ý': 'ITA', 'italia': 'ITA',
    'argentina': 'ARG', 'brazil': 'BRA',
    'portugal': 'POR', 'bồ đào nha': 'POR',
    'norway': 'NOR', 'na uy': 'NOR',
    'netherlands': 'NED', 'hà lan': 'NED',
    'belgium': 'BEL', 'bỉ': 'BEL',
    'croatia': 'CRO', 'denmark': 'DEN', 'đan mạch': 'DEN',
    'sweden': 'SWE', 'thụy điển': 'SWE',
    'switzerland': 'SUI', 'thụy sĩ': 'SUI',
    'austria': 'AUT', 'áo': 'AUT',
    'poland': 'POL', 'ba lan': 'POL',
    'ukraine': 'UKR', 'thổ nhĩ kỳ': 'TUR', 'turkey': 'TUR',
    'scotland': 'SCO', 'wales': 'WAL', 'uruguay': 'URU',
    'colombia': 'COL', 'chile': 'CHI', 'mexico': 'MEX',
    'japan': 'JPN', 'nhật bản': 'JPN', 'south korea': 'KOR', 'hàn quốc': 'KOR',
    'morocco': 'MAR', 'senegal': 'SEN', 'nigeria': 'NGA', 'egypt': 'EGY'
  };
  
  if (map[lower]) return map[lower];

  // Look up in our standard constants
  const found = COUNTRIES.find(c => 
    c.name.toLowerCase() === lower || 
    c.code.toLowerCase() === lower ||
    c.iso2.toLowerCase() === lower
  );
  if (found) return found.code;

  // Fuzzy match
  const fuzzy = COUNTRIES.find(c => 
    c.name.toLowerCase().includes(lower) || 
    lower.includes(c.name.toLowerCase())
  );
  if (fuzzy) return fuzzy.code;

  return 'VIE';
}

function mapPositionToCode(pos: string): string {
  if (!pos) return 'CF';
  const lower = pos.toLowerCase();
  if (lower.includes('goalkeeper') || lower.includes('thủ môn')) return 'GK';
  if (lower.includes('centre-back') || lower.includes('centre back') || lower.includes('center back') || lower.includes('hậu vệ quét') || lower.includes('trung vệ')) return 'CB';
  if (lower.includes('left-back') || lower.includes('left back') || lower.includes('hậu vệ cánh trái')) return 'LB';
  if (lower.includes('right-back') || lower.includes('right back') || lower.includes('hậu vệ cánh phải')) return 'RB';
  if (lower.includes('defensive midfielder') || lower.includes('tiền vệ phòng ngự')) return 'DM';
  if (lower.includes('central midfielder') || lower.includes('tiền vệ trung tâm')) return 'CM';
  if (lower.includes('attacking midfielder') || lower.includes('tiền vệ tấn công')) return 'AM';
  if (lower.includes('left midfielder') || lower.includes('tiền vệ cánh trái')) return 'LM';
  if (lower.includes('right midfielder') || lower.includes('tiền vệ cánh phải')) return 'RM';
  if (lower.includes('left winger') || lower.includes('tiền đạo cánh trái')) return 'LW';
  if (lower.includes('right winger') || lower.includes('tiền đạo cánh phải')) return 'RW';
  if (lower.includes('forward') || lower.includes('tiền đạo') || lower.includes('striker')) return 'CF';
  return 'CF';
}

/**
 * Clamp each attribute into a position-appropriate range so AI doesn't give
 * a goalkeeper ATT=75 or a striker DEF=80.
 * ranges: [min, max] per position group.
 */
function normalizeAttributesByPosition(attrs: Record<string, number>, position: string): Record<string, number> {
  // ATT, TEC, TAC, DEF, CRE, STA, PHY
  type AttrRange = { ATT: [number,number]; TEC: [number,number]; TAC: [number,number]; DEF: [number,number]; CRE: [number,number]; STA: [number,number]; PHY: [number,number] };
  const ranges: Record<string, AttrRange> = {
    GK:  { ATT:[8,25],  TEC:[40,65], TAC:[50,70], DEF:[75,95], CRE:[20,45], STA:[65,85], PHY:[70,88] },
    CB:  { ATT:[20,45], TEC:[45,65], TAC:[70,88], DEF:[78,95], CRE:[30,55], STA:[65,82], PHY:[72,90] },
    LB:  { ATT:[40,65], TEC:[55,75], TAC:[65,82], DEF:[65,85], CRE:[45,68], STA:[70,88], PHY:[65,82] },
    RB:  { ATT:[40,65], TEC:[55,75], TAC:[65,82], DEF:[65,85], CRE:[45,68], STA:[70,88], PHY:[65,82] },
    LWB: { ATT:[50,72], TEC:[58,78], TAC:[60,78], DEF:[60,80], CRE:[50,72], STA:[72,90], PHY:[65,82] },
    RWB: { ATT:[50,72], TEC:[58,78], TAC:[60,78], DEF:[60,80], CRE:[50,72], STA:[72,90], PHY:[65,82] },
    DM:  { ATT:[35,58], TEC:[55,75], TAC:[72,88], DEF:[62,82], CRE:[45,68], STA:[72,90], PHY:[70,88] },
    CM:  { ATT:[55,75], TEC:[65,82], TAC:[62,80], DEF:[45,65], CRE:[65,82], STA:[70,88], PHY:[65,80] },
    AM:  { ATT:[65,85], TEC:[70,88], TAC:[45,65], DEF:[30,52], CRE:[72,90], STA:[65,82], PHY:[58,76] },
    LM:  { ATT:[62,82], TEC:[65,82], TAC:[50,70], DEF:[38,58], CRE:[62,80], STA:[72,90], PHY:[62,78] },
    RM:  { ATT:[62,82], TEC:[65,82], TAC:[50,70], DEF:[38,58], CRE:[62,80], STA:[72,90], PHY:[62,78] },
    LW:  { ATT:[72,92], TEC:[68,88], TAC:[35,55], DEF:[20,40], CRE:[68,88], STA:[68,88], PHY:[58,78] },
    RW:  { ATT:[72,92], TEC:[68,88], TAC:[35,55], DEF:[20,40], CRE:[68,88], STA:[68,88], PHY:[58,78] },
    SS:  { ATT:[72,90], TEC:[68,86], TAC:[40,60], DEF:[25,45], CRE:[70,88], STA:[65,85], PHY:[62,80] },
    CF:  { ATT:[78,95], TEC:[65,85], TAC:[30,52], DEF:[15,35], CRE:[65,85], STA:[68,86], PHY:[68,86] },
    ST:  { ATT:[78,95], TEC:[62,82], TAC:[28,50], DEF:[12,32], CRE:[58,78], STA:[68,86], PHY:[72,90] },
  };
  const r = ranges[position] || ranges['CM']; // Default to CM if unknown
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));
  return {
    ATT: clamp(attrs.ATT ?? 60, r.ATT[0], r.ATT[1]),
    TEC: clamp(attrs.TEC ?? 60, r.TEC[0], r.TEC[1]),
    TAC: clamp(attrs.TAC ?? 60, r.TAC[0], r.TAC[1]),
    DEF: clamp(attrs.DEF ?? 60, r.DEF[0], r.DEF[1]),
    CRE: clamp(attrs.CRE ?? 60, r.CRE[0], r.CRE[1]),
    STA: clamp(attrs.STA ?? 70, r.STA[0], r.STA[1]),
    PHY: clamp(attrs.PHY ?? 70, r.PHY[0], r.PHY[1]),
  };
}

async function getOrCreateClub(teamName: string): Promise<string | null> {
  if (!teamName || typeof teamName !== 'string' || teamName.length < 2) return null;
  
  const cleanedClubName = teamName.replace(/\s*\(.*?\)\s*/g, '').trim();
  const clubSlug = cleanedClubName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  let club = await prisma.club.findFirst({
    where: {
      OR: [
        { slug: clubSlug },
        { name: { equals: cleanedClubName, mode: 'insensitive' } }
      ]
    }
  });
  
  if (club) {
    return club.id;
  }
  
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(cleanedClubName)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.teams && data.teams.length > 0) {
        const team = data.teams.find((t: any) => t.strTeam.toLowerCase() === cleanedClubName.toLowerCase()) || data.teams[0];
        const finalSlug = team.strTeam.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        let existingClub = await prisma.club.findFirst({
          where: {
            OR: [
              { slug: finalSlug },
              { name: { equals: team.strTeam, mode: 'insensitive' } }
            ]
          }
        });
        if (existingClub) {
          return existingClub.id;
        }

        let countryId: string | null = null;
        if (team.strCountry) {
          const country = await prisma.country.findFirst({
            where: {
              OR: [
                { name: { equals: team.strCountry, mode: 'insensitive' } },
                { slug: team.strCountry.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-') }
              ]
            }
          });
          if (country) {
            countryId = country.id;
          } else {
            const countrySlug = team.strCountry.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
            const newCountry = await prisma.country.create({
              data: {
                name: team.strCountry,
                slug: countrySlug,
                code: team.strCountry.substring(0, 3).toUpperCase()
              }
            });
            countryId = newCountry.id;
          }
        }

        let leagueId: string | null = null;
        if (team.strLeague) {
          const league = await prisma.league.findFirst({
            where: {
              OR: [
                { name: { equals: team.strLeague, mode: 'insensitive' } },
                { slug: team.strLeague.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-') }
              ]
            }
          });
          if (league) {
            leagueId = league.id;
          }
        }

        const basicInfo = JSON.stringify({
          fullName: team.strTeam,
          nickname: team.strAlternate || '',
          formedYear: team.intFormedYear ? `${team.intFormedYear}-01-01` : '',
          stadium: team.strStadium || '',
          stadiumCapacity: team.intStadiumCapacity || '',
          manager: '',
          website: team.strWebsite || '',
          description: team.strDescriptionEN || ''
        });

        const newClub = await prisma.club.create({
          data: {
            name: team.strTeam,
            slug: finalSlug,
            logo: team.strBadge || team.strLogo || null,
            sportType: 'FOOTBALL',
            basicInfo,
            countryId,
            leagueId,
            achievements: '[]'
          }
        });
        return newClub.id;
      }
    }
  } catch (err) {
    console.error(`Error auto-creating club ${cleanedClubName}:`, err);
  }

  try {
    let existingClub = await prisma.club.findFirst({
      where: {
        OR: [
          { slug: clubSlug },
          { name: { equals: cleanedClubName, mode: 'insensitive' } }
        ]
      }
    });
    if (existingClub) {
      return existingClub.id;
    }

    const basicInfo = JSON.stringify({
      fullName: cleanedClubName,
      nickname: '',
      formedYear: '',
      stadium: '',
      stadiumCapacity: '',
      manager: '',
      website: '',
      description: ''
    });

    const fallbackClub = await prisma.club.create({
      data: {
        name: cleanedClubName,
        slug: clubSlug,
        logo: null,
        sportType: 'FOOTBALL',
        basicInfo,
        achievements: '[]'
      }
    });
    return fallbackClub.id;
  } catch (fallbackErr) {
    console.error(`Error creating fallback club ${cleanedClubName}:`, fallbackErr);
    return null;
  }
}

async function runBackgroundCrawl(nameList: string[], lang: string, targetClubId?: string | null, preloadedShirtNumbers?: Record<string, string>) {
  const progress = global.wikiCrawlProgress!;
  progress.status = 'running';
  progress.total = nameList.length;
  progress.processed = 0;
  progress.results = [];
  progress.lang = lang;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  for (const name of nameList) {
    if (progress.status !== 'running') {
      break;
    }
    progress.currentName = name;
    try {
      let searchName = name;
      if (name.includes('wikipedia.org')) {
        const parts = name.split('/wiki/');
        if (parts.length > 1) {
          searchName = decodeURIComponent(parts[1]).replace(/_/g, ' ').replace(/\s*\(.*?\)\s*/g, '').trim();
        }
      }

      // A. Try to fetch from TheSportsDB first
      let theSportsDbPlayer = null;
      try {
        const sRes = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(searchName)}`, { headers });
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.player && sData.player.length > 0) {
            const pId = sData.player[0].idPlayer;
            const lRes = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupplayer.php?id=${pId}`, { headers });
            if (lRes.ok) {
              const lData = await lRes.json();
              if (lData.players && lData.players.length > 0) {
                theSportsDbPlayer = lData.players[0];
              }
            }
          }
        }
      } catch (e) {
        console.error("Error fetching player from TheSportsDB:", e);
      }

      // B. Wikipedia scrape
      let title = name;
      let avatar = null;
      let excerpt = '';
      let fullText = '';

      if (name.includes('wikipedia.org')) {
        title = searchName;
      }

      try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchName)}&utf8=&format=json`;
        const searchRes = await fetch(searchUrl, { headers });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.query?.search?.length) {
            const firstResult = searchData.query.search[0];
            const resultTitle = firstResult.title;
            // Validate that the result title has some word overlap with the query name to avoid random page hits
            const cleanQuery = cleanStringForComparison(searchName);
            const cleanTitle = cleanStringForComparison(resultTitle);
            const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 1);
            const hasOverlap = queryWords.some(word => cleanTitle.includes(word));
            if (hasOverlap) {
              title = resultTitle;
            } else {
              console.log(`Fuzzy match rejected: query "${searchName}" yielded irrelevant title "${resultTitle}"`);
            }
          }
        }

        const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const summaryRes = await fetch(summaryUrl, { headers });
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          avatar = summaryData.thumbnail?.source || null;
          excerpt = summaryData.extract || '';
        }

        const textUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(title)}&format=json`;
        const textRes = await fetch(textUrl, { headers });
        if (textRes.ok) {
          const textData = await textRes.json();
          const pages = textData.query?.pages;
          const pageId = Object.keys(pages || {})[0];
          fullText = pages[pageId]?.extract || excerpt;
        }
      } catch (e) {
        console.error("Wikipedia fetch error, fallback to name only:", e);
      }

      // Final properties combining Wikipedia + TheSportsDB
      const cleanedName = cleanPlayerName(theSportsDbPlayer?.strPlayer || title);
      const slug = slugify(cleanedName);

      // Check if exists
      const existing = await prisma.entity.findUnique({
        where: { slug }
      });
      if (existing) {
        progress.results.push({ name: cleanedName, status: 'skipped', message: 'Đã tồn tại (Bỏ qua)' });
        progress.processed++;
        continue;
      }

      // Lookup ESPN player and team schedule
      let espnPlayer: any = null;
      let espnMatches: any[] = [];
      try {
        const espnSearch = await searchESPNPlayer(cleanedName, theSportsDbPlayer?.strTeam);
        if (espnSearch) {
          espnPlayer = await getESPNPlayerDetails(espnSearch.id, espnSearch.leagueSlug);
          if (espnPlayer && espnPlayer.teamId) {
            espnMatches = await getESPNRecentMatches(espnPlayer.teamId, espnSearch.leagueSlug);
          }
        }
      } catch (err) {
        console.error("ESPN Lookup error:", err);
      }

      if (!avatar && espnPlayer?.avatar) {
        avatar = espnPlayer.avatar;
      }
      if (!avatar && theSportsDbPlayer?.strThumb) {
        avatar = theSportsDbPlayer.strThumb;
      }
      if (!excerpt && theSportsDbPlayer?.strDescriptionEN) {
        excerpt = theSportsDbPlayer.strDescriptionEN.substring(0, 300);
      }

      // C. AI prompt leveraging known facts
      const knownFacts = `
- Full Name: ${espnPlayer?.fullName || theSportsDbPlayer?.strPlayerAlternate || theSportsDbPlayer?.strPlayer || cleanedName}
- Birth Date: ${espnPlayer?.birthDate || theSportsDbPlayer?.dateBorn || ''}
- Nationality: ${espnPlayer?.nationality || theSportsDbPlayer?.strNationality || ''}
- Height: ${espnPlayer?.height ? `${espnPlayer.height} cm` : theSportsDbPlayer?.strHeight || ''}
- Position: ${espnPlayer?.position || theSportsDbPlayer?.strPosition || ''}
- Preferred Foot: ${theSportsDbPlayer?.strSide || ''}
- Shirt Number: ${espnPlayer?.jersey || theSportsDbPlayer?.strNumber || ''}
- Current Club: ${espnPlayer?.teamName || theSportsDbPlayer?.strTeam || ''}
- Appearances: ${espnPlayer?.stats?.appearances || ''}
- Goals: ${espnPlayer?.stats?.goals || ''}
- Assists: ${espnPlayer?.stats?.assists || ''}
`;

      const systemPrompt = `Bạn là chuyên gia phân tích dữ liệu bóng đá và thống kê thể thao.
Hãy phân tích nội dung Wikipedia sau về cầu thủ "${title}" kết hợp với các thông tin đã biết từ TheSportsDB để trích xuất thành định dạng JSON CHÍNH XÁC.
LƯU Ý QUAN TRỌNG: Nếu Wikipedia không cung cấp đủ các thông số chi tiết (như Radar chart, điểm Sofascore, chân thuận, điểm mạnh/yếu, giá trị chuyển nhượng, biểu đồ phong độ monthlyForm, ratingHistory, matches), BẠN ĐƯỢC PHÉP DÙNG KIẾN THỨC CỦA MÌNH ĐỂ ƯỚC LƯỢNG VÀ ĐIỀN VÀO (ví dụ cầu thủ nổi tiếng thì bạn tự biết các chỉ số này).

Thông tin đã biết từ TheSportsDB:
"""
${knownFacts}
"""

Dữ liệu Wiki:
"""
${fullText.substring(0, 10000)}
"""

Yêu cầu trả về đúng cấu trúc JSON sau (không chứa markdown \`\`\`json):
{
  "basicInfo": {
    "fullName": "Tên đầy đủ",
    "birthDate": "Ngày sinh (BẮT BUỘC định dạng YYYY-MM-DD, VD: 1997-10-30)",
    "nationality": ["Mảng chứa mã quốc tịch 3 chữ cái viết hoa. Ví dụ: [\"FRA\"] hoặc [\"VIE\", \"FRA\"]"],
    "height": "Chiều cao (cm, ví dụ: 178)",
    "position": ["Mảng chứa vị trí viết tắt. Các giá trị hợp lệ: GK, CB, LB, RB, LWB, RWB, DM, CM, AM, LM, RM, LW, RW, CF, ST, SS. Ví dụ: [\"CF\"]"],
    "preferredFoot": "Chân thuận (Left/Right/Both)",
    "shirtNumber": "Số áo (chỉ số, ví dụ: 7)",
    "playerValue": "Giá trị chuyển nhượng (Ví dụ: 147M € hoặc 15M €)",
    "contractUntil": "Hạn hợp đồng (BẮT BUỘC định dạng YYYY-MM-DD, VD: 2027-06-30)",
    "excerpt": "${excerpt.replace(/"/g, '\\"')}"
  },
  "attributes": {
    "ATT": 85, 
    "TEC": 80, 
    "TAC": 75, 
    "DEF": 40, 
    "CRE": 82,
    "STA": 78,
    "PHY": 80
  },
  "strengthsAndWeaknesses": {
    "strengths": ["Positioning", "Penalty taking"],
    "weaknesses": ["Aerial duels"]
  },
  "achievements": [],
  "stats": {
    "totalMatches": 100,
    "totalGoals": 50,
    "averageRating": "7.8"
  },
  "ratingHistory": {
    "average": "7.8",
    "history": [
      { "date": "Th1", "rating": 7.4 },
      { "date": "Th2", "rating": 7.6 },
      { "date": "Th3", "rating": 7.8 },
      { "date": "Th4", "rating": 7.5 },
      { "date": "Th5", "rating": 7.9 }
    ]
  },
  "monthlyForm": [
    { "month": "T1", "rating": 7.3 },
    { "month": "T2", "rating": 7.5 },
    { "month": "T3", "rating": 7.8 },
    { "month": "T4", "rating": 8.0 },
    { "month": "T5", "rating": 7.4 },
    { "month": "T6", "rating": 7.9 }
  ],
  "matches": [
    {
      "id": "m1",
      "tournament": "Premier League",
      "date": "Vòng 38",
      "status": "FT",
      "team1": { "name": "Arsenal", "logo": "" },
      "team2": { "name": "Chelsea", "logo": "" },
      "score1": 2,
      "score2": 1,
      "playerRating": "7.8"
    }
  ],
  "clubName": "Tên câu lạc bộ hiện tại (nếu có, ví dụ: Arsenal)"
}`;

      const ENABLE_AI = false; // Set to true to use AI, false to run 100% deterministic (faster, no cost, highly reliable)
      let contentText = "{}";
      let isAiSuccess = false;
      if (ENABLE_AI) {
        try {
          contentText = await generateWithFallback(
            systemPrompt,
            'You are a highly capable JSON data generation assistant. Only return valid JSON without markdown wrapping.',
            true
          );
          isAiSuccess = true;
        } catch (err: any) {
          console.error(`AI generation failed for ${cleanedName}, using fallback parser:`, err);
        }
      }

      let parsedData: any = {};
      if (isAiSuccess) {
        try {
          let cleanJson = contentText;
          const firstBrace = contentText.indexOf('{');
          const lastBrace = contentText.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanJson = contentText.substring(firstBrace, lastBrace + 1);
          }
          parsedData = JSON.parse(cleanJson);
        } catch (jsonErr) {
          console.error("JSON parse of AI output failed, fallback to manual parsing:", jsonErr);
          isAiSuccess = false;
        }
      }

      if (!isAiSuccess) {
        // Build fallback using TheSportsDB, ESPN and smart deterministic heuristics
        const pos = espnPlayer?.position || theSportsDbPlayer?.strPosition || 'Forward';
        const positionAbbr = mapPositionToCode(pos);
        
        // Match strengths and weaknesses based on position
        const strengthsMap: Record<string, string[]> = {
          GK: ["Phản xạ", "Cản phá xuất sắc", "Chỉ huy vòng cấm"],
          CB: ["Tranh chấp tay đôi", "Không chiến", "Đọc tình huống"],
          LB: ["Tốc độ", "Tạt bóng", "Bền bỉ"],
          RB: ["Tốc độ", "Tạt bóng", "Bền bỉ"],
          LWB: ["Chạy cánh", "Tạt bóng", "Thể lực"],
          RWB: ["Chạy cánh", "Tạt bóng", "Thể lực"],
          DM: ["Đánh chặn", "Thể lực", "Tranh chấp"],
          CM: ["Chuyền bóng", "Kiểm soát bóng", "Nhãn quan"],
          AM: ["Kiến tạo", "Rê bóng", "Nhãn quan chiến thuật"],
          LM: ["Tốc độ", "Rê bóng", "Tạt bóng"],
          RM: ["Tốc độ", "Rê bóng", "Tạt bóng"],
          LW: ["Tốc độ", "Dứt điểm", "Rê bóng"],
          RW: ["Tốc độ", "Dứt điểm", "Rê bóng"],
          CF: ["Dứt điểm", "Chọn vị trí", "Sút xa"],
          ST: ["Dứt điểm", "Chọn vị trí", "Đánh đầu"],
          SS: ["Rê bóng", "Kiến tạo", "Sút xa"]
        };
        const weaknessesMap: Record<string, string[]> = {
          GK: ["Chơi chân"],
          CB: ["Tốc độ xoay sở"],
          LB: ["Không chiến"],
          RB: ["Không chiến"],
          LWB: ["Khả năng phòng thủ"],
          RWB: ["Khả năng phòng thủ"],
          DM: ["Dứt điểm từ xa"],
          CM: ["Tốc độ", "Tranh chấp tay đôi"],
          AM: ["Hỗ trợ phòng ngự"],
          LM: ["Không chiến"],
          RM: ["Không chiến"],
          LW: ["Hỗ trợ phòng ngự"],
          RW: ["Hỗ trợ phòng ngự"],
          CF: ["Hỗ trợ phòng ngự"],
          ST: ["Hỗ trợ phòng ngự"],
          SS: ["Thể chất"]
        };

        const strengths = strengthsMap[positionAbbr] || ["Tốc độ", "Thể lực"];
        const weaknesses = weaknessesMap[positionAbbr] || ["Không chiến"];

        // Parse trophies / achievements from Wikipedia text
        const achievements: string[] = [];
        const matchesAchievements = [
          { name: "Premier League", keywords: ["Premier League", "Ngoại hạng Anh"] },
          { name: "La Liga", keywords: ["La Liga", "Vô địch Tây Ban Nha"] },
          { name: "Champions League", keywords: ["Champions League", "Cúp C1"] },
          { name: "World Cup", keywords: ["World Cup", "Vô địch thế giới"] },
          { name: "Serie A", keywords: ["Serie A", "Vô địch Ý"] },
          { name: "Bundesliga", keywords: ["Bundesliga", "Vô địch Đức"] },
          { name: "Ligue 1", keywords: ["Ligue 1", "Vô địch Pháp"] },
          { name: "Copa America", keywords: ["Copa America"] },
          { name: "Euro", keywords: ["Euro", "Vô địch châu Âu"] },
          { name: "V.League", keywords: ["V.League", "V-League", "Vô địch quốc gia Việt Nam"] }
        ];
        for (const item of matchesAchievements) {
          if (item.keywords.some(kw => fullText.includes(kw))) {
            achievements.push(item.name);
          }
        }

        // Determine preferred foot
        let preferredFoot = theSportsDbPlayer?.strSide || 'Right';
        if (!theSportsDbPlayer?.strSide) {
          const lowerText = fullText.toLowerCase();
          if (lowerText.includes("thuận chân trái") || lowerText.includes("chân thuận: trái")) {
            preferredFoot = "Left";
          } else if (lowerText.includes("thuận cả hai chân") || lowerText.includes("thuận hai chân")) {
            preferredFoot = "Both";
          }
        }

        parsedData = {
          basicInfo: {
            fullName: espnPlayer?.fullName || theSportsDbPlayer?.strPlayerAlternate || cleanedName,
            birthDate: espnPlayer?.birthDate || theSportsDbPlayer?.dateBorn || '1998-01-01',
            nationality: [mapCountryToCode(espnPlayer?.nationality || theSportsDbPlayer?.strNationality || 'Vietnam')],
            height: espnPlayer?.height ? espnPlayer.height.toString() : (theSportsDbPlayer?.strHeight ? parseInt(theSportsDbPlayer.strHeight) || '180' : '180'),
            position: [positionAbbr],
            preferredFoot,
            shirtNumber: espnPlayer?.jersey || theSportsDbPlayer?.strNumber || '10',
            playerValue: '1M €',
            contractUntil: '2028-06-30',
            excerpt: excerpt
          },
          attributes: {
            ATT: positionAbbr === 'CF' || positionAbbr === 'LW' || positionAbbr === 'RW' ? 82 : 55,
            TEC: 78,
            TAC: positionAbbr === 'CB' || positionAbbr === 'DM' ? 78 : 55,
            DEF: positionAbbr === 'CB' || positionAbbr === 'GK' ? 80 : 35,
            CRE: positionAbbr === 'CM' || positionAbbr === 'AM' ? 80 : 60,
            STA: 75,
            PHY: 75
          },
          strengthsAndWeaknesses: {
            strengths,
            weaknesses
          },
          achievements,
          stats: {
            totalMatches: espnPlayer?.stats?.appearances || 60,
            totalGoals: espnPlayer?.stats?.goals || (positionAbbr === 'CF' ? 22 : 4),
            averageRating: "7.1"
          },
          ratingHistory: {
            average: "7.1",
            history: []
          },
          monthlyForm: [],
          matches: [],
          clubName: espnPlayer?.teamName || theSportsDbPlayer?.strTeam || ''
        };
      }

      // Find existing club in the system or fetch/create if missing
      let clubId = targetClubId || null;
      if (!clubId) {
        const targetClubName = espnPlayer?.teamName || parsedData.clubName || theSportsDbPlayer?.strTeam;
        if (targetClubName && typeof targetClubName === 'string' && targetClubName.length > 2) {
          const resolvedClubId = await getOrCreateClub(targetClubName);
          if (resolvedClubId) {
            clubId = resolvedClubId;
          }
        }
      }

      // Normalize attributes to position-appropriate ranges
      if (parsedData.attributes && parsedData.basicInfo?.position) {
        const positions: string[] = Array.isArray(parsedData.basicInfo.position)
          ? parsedData.basicInfo.position
          : [parsedData.basicInfo.position];
        const primaryPos = positions[0] || 'CM';
        parsedData.attributes = normalizeAttributesByPosition(parsedData.attributes, primaryPos);
      }

      // Dynamically calculate averageRating & generate Sofascore rating history/monthly form
      if (parsedData.attributes) {
        const goals = espnPlayer?.stats?.goals ?? parsedData.stats?.totalGoals ?? 0;
        const assists = espnPlayer?.stats?.assists ?? 0;
        const fallbackRatings = generateFallbackRatings(parsedData.attributes, goals, assists);

        if (!parsedData.stats) {
          parsedData.stats = {};
        }
        parsedData.stats.averageRating = fallbackRatings.averageRating;
        parsedData.ratingHistory = fallbackRatings.ratingHistory;
        parsedData.monthlyForm = fallbackRatings.monthlyForm;
      }

      // Override stats goals, matches if ESPN data is available
      if (espnPlayer?.stats) {
        if (!parsedData.stats) parsedData.stats = {};
        parsedData.stats.totalGoals = espnPlayer.stats.goals;
        parsedData.stats.totalMatches = espnPlayer.stats.appearances;
      }

      // Use real ESPN matches with real logos and dynamic ratings
      if (espnMatches && espnMatches.length > 0) {
        const baseRating = parseFloat(parsedData.stats?.averageRating || '7.0');
        parsedData.matches = espnMatches.map((m: any, idx: number) => {
          const fluctuation = (Math.sin(idx * 2) * 0.4); // realistic variance
          const rating = Math.min(Math.max(baseRating + fluctuation, 5.5), 9.8);
          return {
            ...m,
            playerRating: rating.toFixed(1)
          };
        });
      }

      // Scrape/Calculate Transfermarkt value
      if (parsedData.basicInfo) {
        const baseRating = parseFloat(parsedData.stats?.averageRating || '7.0');
        const birthYear = parsedData.basicInfo.birthDate ? new Date(parsedData.basicInfo.birthDate).getFullYear() : 2001;
        const age = new Date().getFullYear() - birthYear;
        parsedData.basicInfo.playerValue = await getTransfermarktValue(cleanedName, baseRating, age);
      }

      // Override shirtNumber from preloadedShirtNumbers if available
      if (preloadedShirtNumbers && preloadedShirtNumbers[searchName] && parsedData.basicInfo) {
        parsedData.basicInfo.shirtNumber = preloadedShirtNumbers[searchName];
      } else if (espnPlayer?.jersey && parsedData.basicInfo) {
        parsedData.basicInfo.shirtNumber = espnPlayer.jersey;
      }

      // Override basicInfo weight/height if ESPN has real data
      if (parsedData.basicInfo) {
        if (espnPlayer?.height) {
          parsedData.basicInfo.height = espnPlayer.height.toString();
        }
        if (espnPlayer?.birthDate) {
          parsedData.basicInfo.birthDate = espnPlayer.birthDate;
        }
        if (espnPlayer?.fullName) {
          parsedData.basicInfo.fullName = espnPlayer.fullName;
        }
      }

      const basicInfoWithClub = {
        ...(parsedData.basicInfo || {}),
        currentClub: espnPlayer?.teamName || parsedData.clubName || theSportsDbPlayer?.strTeam || '',
        monthlyForm: parsedData.monthlyForm || null,
        ratingHistory: parsedData.ratingHistory || null
      };

      const combinedStats = {
        ...(parsedData.stats || {}),
        attributes: parsedData.attributes || null,
        strengthsAndWeaknesses: parsedData.strengthsAndWeaknesses || null,
        matches: parsedData.matches || []
      };

      const entity = await prisma.entity.upsert({
        where: { slug: slug },
        update: {
          name: cleanedName,
          avatar: avatar,
          type: 'FOOTBALL_PLAYER',
          clubId: clubId,
          basicInfo: JSON.stringify(basicInfoWithClub),
          achievements: JSON.stringify(parsedData.achievements || []),
          stats: JSON.stringify(combinedStats)
        },
        create: {
          name: cleanedName,
          slug: slug,
          avatar: avatar,
          type: 'FOOTBALL_PLAYER',
          clubId: clubId,
          basicInfo: JSON.stringify(basicInfoWithClub),
          achievements: JSON.stringify(parsedData.achievements || []),
          stats: JSON.stringify(combinedStats)
        }
      });

      progress.results.push({ name: cleanedName, status: 'success', entity });
    } catch (err: any) {
      console.error(`Lỗi khi crawl ${name}:`, err);
      progress.results.push({ name, status: 'error', message: err.message });
    }
    progress.processed++;
  }

  progress.status = 'completed';
}

export async function GET() {
  return NextResponse.json({ success: true, progress: global.wikiCrawlProgress });
}

export async function POST(request: Request) {
  try {
    const { action, names, lang = 'vi', clubId } = await request.json();

    if (action === 'clear') {
      global.wikiCrawlProgress = {
        status: 'idle',
        total: 0,
        processed: 0,
        currentName: '',
        results: [],
        lang: 'vi'
      };
      return NextResponse.json({ success: true, progress: global.wikiCrawlProgress });
    }

    if (action === 'stop') {
      if (global.wikiCrawlProgress) {
        global.wikiCrawlProgress.status = 'failed';
      }
      return NextResponse.json({ success: true, progress: global.wikiCrawlProgress });
    }

    if (action === 'start') {
      if (global.wikiCrawlProgress?.status === 'running') {
        return NextResponse.json({ success: false, error: 'Tiến trình crawl đang chạy, không thể bắt đầu tiến trình mới.' }, { status: 400 });
      }

      let nameList = typeof names === 'string'
        ? names.split(/[\n,]/).map((n: string) => n.trim()).filter((n: string) => n.length > 0)
        : Array.isArray(names) ? names : [];
      
      let preloadedShirtNumbers: Record<string, string> | undefined = undefined;

      // If nameList is empty but clubId is provided, get squad from TheSportsDB
      if (nameList.length === 0 && clubId) {
        const club = await prisma.club.findUnique({ where: { id: clubId } });
        if (club) {
          try {
            const teamRes = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?t=${encodeURIComponent(club.name)}`, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              if (teamData.player && teamData.player.length > 0) {
                nameList = teamData.player.map((p: any) => p.strPlayer);
                // Build shirt number map from squad data
                preloadedShirtNumbers = {};
                for (const p of teamData.player) {
                  if (p.strPlayer && p.strNumber) {
                    preloadedShirtNumbers[p.strPlayer] = p.strNumber;
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error fetching squad from TheSportsDB:", e);
          }
        }
      }

      if (nameList.length === 0) {
        return NextResponse.json({ success: false, error: 'Danh sách cầu thủ trống hoặc không tìm thấy cầu thủ cho CLB đã chọn.' }, { status: 400 });
      }

      // Initialize global state
      global.wikiCrawlProgress = {
        status: 'running',
        total: nameList.length,
        processed: 0,
        currentName: nameList[0],
        results: [],
        lang
      };

      // Run task asynchronously in the background
      runBackgroundCrawl(nameList, lang, clubId, preloadedShirtNumbers);

      return NextResponse.json({ success: true, progress: global.wikiCrawlProgress });
    }

    return NextResponse.json({ success: false, error: 'Hành động không hợp lệ' }, { status: 400 });

  } catch (error: any) {
    console.error("Lỗi Api Crawler:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
