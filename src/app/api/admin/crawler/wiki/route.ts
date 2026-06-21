import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateWithFallback } from '@/lib/aiBox';

export async function POST(request: Request) {
  try {
    const { names, lang = 'vi', skipIfExists = false } = await request.json();

    if (!names) {
      return NextResponse.json({ success: false, error: 'Thiếu danh sách tên cầu thủ' }, { status: 400 });
    }

    const nameList = typeof names === 'string'
      ? names.split(/[\n,]/).map((n: string) => n.trim()).filter((n: string) => n.length > 0)
      : Array.isArray(names) ? names : [];
    const results = [];

    for (const name of nameList) {
      try {
        // 1. Search Wikipedia for the exact page title
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&utf8=&format=json`;
        const searchRes = await fetch(searchUrl, { headers });
        if (!searchRes.ok) {
          throw new Error(`Wikipedia search API error: ${searchRes.status}`);
        }
        const searchData = await searchRes.json();
        
        if (!searchData.query?.search?.length) {
          results.push({ name, status: 'error', message: 'Không tìm thấy trên Wikipedia' });
          continue;
        }

        const title = searchData.query.search[0].title;
        const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        if (skipIfExists) {
          const existing = await prisma.entity.findUnique({
            where: { slug }
          });
          if (existing) {
            results.push({ name: title, status: 'skipped', message: 'Đã tồn tại (Bỏ qua)' });
            continue;
          }
        }

        // 2. Fetch page summary and thumbnail (REST API)
        const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const summaryRes = await fetch(summaryUrl, { headers });
        if (!summaryRes.ok) {
          throw new Error(`Wikipedia summary API error: ${summaryRes.status}`);
        }
        const summaryData = await summaryRes.json();
        
        const avatar = summaryData.thumbnail?.source || null;
        const excerpt = summaryData.extract || '';

        // 3. Fetch full wikitext for AI parsing
        const textUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(title)}&format=json`;
        const textRes = await fetch(textUrl, { headers });
        if (!textRes.ok) {
          throw new Error(`Wikipedia extract text API error: ${textRes.status}`);
        }
        const textData = await textRes.json();
        
        const pages = textData.query?.pages;
        const pageId = Object.keys(pages || {})[0];
        const fullText = pages[pageId]?.extract || excerpt;

        // 4. Extract structured data using Gemini/Qwen AI
        const systemPrompt = `Bạn là chuyên gia phân tích dữ liệu bóng đá và thống kê thể thao.
Hãy phân tích nội dung Wikipedia sau về cầu thủ "${title}" và kết hợp với kiến thức chuyên môn của bạn để trích xuất thành định dạng JSON CHÍNH XÁC.
LƯU Ý QUAN TRỌNG: Nếu Wikipedia không cung cấp đủ các thông số chi tiết (như Radar chart, điểm Sofascore, chân thuận, điểm mạnh/yếu, giá trị chuyển nhượng), BẠN ĐƯỢC PHÉP DÙNG KIẾN THỨC CỦA MÌNH ĐỂ ƯỚC LƯỢNG VÀ ĐIỀN VÀO (ví dụ cầu thủ nổi tiếng thì bạn tự biết các chỉ số này).

Dữ liệu Wiki:
"""
${fullText.substring(0, 15000)}
"""

Yêu cầu trả về đúng cấu trúc JSON sau (không chứa markdown \`\`\`json):
{
  "basicInfo": {
    "fullName": "Tên đầy đủ",
    "birthDate": "Ngày sinh (BẮT BUỘC định dạng YYYY-MM-DD, VD: 1997-10-30)",
    "nationality": ["Mảng chứa mã quốc tịch 3 chữ cái viết hoa, chính đứng trước, phụ đứng sau. Ví dụ: [\"FRA\"] hoặc [\"VIE\", \"FRA\"]"],
    "height": "Chiều cao (cm, ví dụ: 178)",
    "position": ["Mảng chứa vị trí viết tắt, chính đứng trước, phụ đứng sau. Các giá trị hợp lệ: GK, CB, LB, RB, LWB, RWB, DM, CM, AM, LM, RM, LW, RW, CF, ST, SS, F, M, D. Ví dụ: [\"CF\"] hoặc [\"LW\", \"RW\"]"],
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
    "strengths": ["Positioning", "Penalty taking", "High pressing"],
    "weaknesses": ["Aerial duels"]
  },
  "achievements": [
    "Danh hiệu 1", "Danh hiệu 2"
  ],
  "stats": {
    "totalMatches": 100,
    "totalGoals": 50,
    "averageRating": "7.8"
  },
  "clubName": "Tên câu lạc bộ hiện tại (nếu có, ví dụ: Arsenal)"
}`;

        let contentText = "{}";

        try {
          contentText = await generateWithFallback(
            systemPrompt,
            'You are a highly capable JSON data generation assistant. Only return valid JSON without markdown wrapping.',
            true
          );
        } catch (err: any) {
          throw new Error(`AI generation failed: ${err.message}`);
        }

        // Trích xuất phần JSON trong trường hợp AI trả về text hội thoại bọc ngoài
        let cleanJson = contentText;
        const firstBrace = contentText.indexOf('{');
        const lastBrace = contentText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = contentText.substring(firstBrace, lastBrace + 1);
        }

        const parsedData = JSON.parse(cleanJson);

        // 5. Store in Database
        
        
        // Find or create club if present
        let clubId = null;
        if (parsedData.clubName && typeof parsedData.clubName === 'string' && parsedData.clubName.length > 2) {
          const clubSlug = parsedData.clubName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
          let club = await prisma.club.findUnique({ where: { slug: clubSlug } });
          if (!club) {
             club = await prisma.club.create({
               data: { name: parsedData.clubName, slug: clubSlug, sportType: 'FOOTBALL' }
             });
          }
          clubId = club.id;
        }

        const combinedStats = {
          ...(parsedData.stats || {}),
          attributes: parsedData.attributes || null,
          strengthsAndWeaknesses: parsedData.strengthsAndWeaknesses || null
        };

        const entity = await prisma.entity.upsert({
          where: { slug: slug },
          update: {
            name: title,
            avatar: avatar,
            type: 'FOOTBALL_PLAYER',
            clubId: clubId,
            basicInfo: JSON.stringify(parsedData.basicInfo || {}),
            achievements: JSON.stringify(parsedData.achievements || []),
            stats: JSON.stringify(combinedStats)
          },
          create: {
            name: title,
            slug: slug,
            avatar: avatar,
            type: 'FOOTBALL_PLAYER',
            clubId: clubId,
            basicInfo: JSON.stringify(parsedData.basicInfo || {}),
            achievements: JSON.stringify(parsedData.achievements || []),
            stats: JSON.stringify(combinedStats)
          }
        });

        results.push({ name: title, status: 'success', entity });

      } catch (err: any) {
        console.error(`Lỗi khi crawl ${name}:`, err);
        results.push({ name, status: 'error', message: err.message });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("Lỗi Wiki Crawler:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
