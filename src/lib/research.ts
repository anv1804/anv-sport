import * as cheerio from "cheerio";

/**
 * Cào DuckDuckGo (HTML version) để lấy các bài viết/snippets liên quan
 */
export async function searchWebForInfo(query: string): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!res.ok) return "";
    
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let info = "";
    $(".result").each((i, el) => {
      if (i > 3) return; // Chỉ lấy top 4 kết quả
      const title = $(el).find(".result__title").text().trim();
      const snippet = $(el).find(".result__snippet").text().trim();
      if (title && snippet) {
        info += `- ${title}: ${snippet}\n`;
      }
    });
    
    return info;
  } catch (e) {
    console.error("Lỗi searchWebForInfo:", e);
    return "";
  }
}

/**
 * Cào Bing Image để lấy thêm hình ảnh minh họa chất lượng cao
 */
export async function searchWebForImages(query: string): Promise<{ url: string; alt: string; source: string }[]> {
  try {
    // Tối ưu hóa query: Lấy 8 từ đầu tiên của tiêu đề và thêm chữ "sports match" để ép Bing trả về ảnh thể thao
    const optimizedQuery = query.split(/\s+/).slice(0, 8).join(" ") + " sports match";
    // Thêm adlt=strict để BẮT BUỘC bật SafeSearch ở mức cao nhất
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(optimizedQuery)}&adlt=strict`;
    const bingRes = await fetch(bingUrl, { headers: { "User-Agent": "Mozilla/5.0" }});
    
    if (!bingRes.ok) return [];

    const bingHtml = await bingRes.text();
    const $ = cheerio.load(bingHtml);
    
    const images: { url: string; alt: string; source: string }[] = [];
    
    $("a.iusc").each((i, el) => {
      const m = $(el).attr("m");
      if (m) {
        try {
          const parsed = JSON.parse(m);
          if (parsed.murl) {
            const urlLower = parsed.murl.toLowerCase();
            const altLower = (parsed.t || "").toLowerCase();
            // Bộ lọc loại trừ các từ khoá nhạy cảm hoặc domain đen
            const isUnsafe = /nsfw|porn|sex|nude|naked|adult|xxx|onlyfans|xvideos|escort|hookup|babes|bikini|model|girl|hot|sexy|boobs|ass|tits|scandal|nguc|vu|mong|18\+|gai|bikini|noi-y|do-lot|casino|betting|gamble|loto|ads|adserving/i.test(urlLower) || /nsfw|porn|sex|nude|naked|adult|xxx|onlyfans|xvideos|escort|hookup|babes|bikini|model|girl|hot|sexy|boobs|ass|tits|scandal|nguc|vu|mong|18\+|gai|bikini|noi-y|do-lot|casino/i.test(altLower);
            
            if (!isUnsafe) {
              images.push({
                url: parsed.murl,
                alt: parsed.t || "",
                source: parsed.purl || ""
              });
            }
          }
        } catch (e) {}
      }
    });
    
    // Chỉ lấy đúng số lượng ảnh cần thiết sau khi đã lọc sạch
    return images.slice(0, 5);
  } catch (e) {
    console.error("Lỗi searchWebForImages:", e);
    return [];
  }
}
