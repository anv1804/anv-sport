"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { searchWebForInfo, searchWebForImages } from "@/lib/research";
import { uploadToSupabase } from "@/services/supabaseUploader";
import { generateWithFallback } from "@/lib/aiBox";
import { evaluateSeo } from "@/lib/seo/evaluator";

function enrichMetadata(title: string, excerpt: string, content: string, metadataStr: string | null): string {
  let meta: any = {};
  if (metadataStr) {
    try {
      meta = JSON.parse(metadataStr);
    } catch (e) {}
  }

  const seoResult = evaluateSeo({
    title,
    excerpt: excerpt || "",
    content: content || "",
    keywords: meta.seoKeywords || "",
    seoTitle: meta.seoTitle,
    seoDescription: meta.seoDescription,
    seoUrl: meta.seoUrl
  });

  const wordCount = content ? content.replace(/<[^>]*>?/gm, " ").trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  meta.seoScore = seoResult.score;
  meta.wordCount = wordCount;

  return JSON.stringify(meta);
}

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const status = formData.get("status") as string || "DRAFT";
  const type = formData.get("type") as string || "STANDARD";
  const metadata = formData.get("metadata") as string || null;
  const isAiGenerated = formData.get("isAiGenerated") === "true";

  if (!title || !content) throw new Error("Title and content are required");

  let categoryConnectCreate: any = undefined;
  if (metadata) {
    try {
      const parsedMeta = JSON.parse(metadata);
      if (parsedMeta.mainCategory) {
        categoryConnectCreate = { connect: [{ slug: parsedMeta.mainCategory }] };
      }
    } catch (e) {}
  }

  const enrichedMetadata = enrichMetadata(title, excerpt, content, metadata);

  await prisma.post.create({
    data: { title, excerpt, content, imageUrl, status, type, metadata: enrichedMetadata, isAiGenerated,
      ...(categoryConnectCreate && { categories: categoryConnectCreate }) },
  });
  revalidatePath("/admin/posts");
  revalidatePath("/");
  redirect("/admin/posts");
}

export async function updatePost(id: number, formData: FormData) {
  const title = formData.get("title") as string;
  const excerpt = formData.get("excerpt") as string;
  const content = formData.get("content") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const status = formData.get("status") as string || "DRAFT";
  const type = formData.get("type") as string || "STANDARD";
  const metadata = formData.get("metadata") as string || null;

  if (!title || !content) throw new Error("Title and content are required");

  let categoryConnectUpdate: any = undefined;
  if (metadata) {
    try {
      const parsedMeta = JSON.parse(metadata);
      categoryConnectUpdate = parsedMeta.mainCategory
        ? { set: [{ slug: parsedMeta.mainCategory }] }
        : { set: [] };
    } catch (e) {}
  }

  const enrichedMetadata = enrichMetadata(title, excerpt, content, metadata);

  await prisma.post.update({
    where: { id },
    data: { title, excerpt, content, imageUrl, status, type, metadata: enrichedMetadata,
      ...(categoryConnectUpdate && { categories: categoryConnectUpdate }) },
  });
  revalidatePath("/admin/posts");
  revalidatePath("/");
  redirect("/admin/posts");
}

export async function deletePost(id: number) {
  await prisma.post.delete({ where: { id } });
  revalidatePath("/admin/posts");
  revalidatePath("/");
}

export async function togglePostStatus(id: number, currentStatus: string) {
  const newStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  await prisma.post.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/posts");
  revalidatePath("/");
  return { success: true, newStatus };
}

export async function updatePostStatus(id: number, newStatus: string) {
  await prisma.post.update({ where: { id }, data: { status: newStatus } });
  revalidatePath("/admin/posts");
  revalidatePath("/admin/zone-posts");
  revalidatePath("/");
  return { success: true, newStatus };
}

export async function bulkUpdatePostStatus(ids: number[], newStatus: string) {
  await prisma.post.updateMany({ where: { id: { in: ids } }, data: { status: newStatus } });
  revalidatePath("/admin/posts");
  revalidatePath("/admin/zone-posts");
  revalidatePath("/");
  return { success: true, newStatus };
}

export async function bulkDeletePosts(ids: number[]) {
  await prisma.post.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/posts");
  revalidatePath("/");
  return { success: true };
}

export async function generateArticleWithAI(title: string, url: string, isForeign: boolean = false) {
  try {
    // ─── BƯỚC 1: Crawl nội dung từ URL ───
    let sourceContent = "";
    let extractedImages: { url: string; description: string }[] = [];
    let ogImage = "";
    let sourceTitle = "";
    let extractedPublishedAt: Date | null = null;

    if (url) {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      const html = await response.text();
      const $ = cheerio.load(html);
      
      sourceTitle = $("title").text().trim();

      // ─── Extract publication date ───
      const dateMeta =
        $("meta[property='article:published_time']").attr("content") ||
        $("meta[name='article:published_time']").attr("content") ||
        $("meta[name='pubdate']").attr("content") ||
        $("meta[name='publish_date']").attr("content") ||
        $("meta[name='date']").attr("content") ||
        $("meta[property='og:article:published_time']").attr("content") ||
        $("time[datetime]").first().attr("datetime") ||
        $("[itemprop='datePublished']").attr("datetime") ||
        $("[itemprop='datePublished']").attr("content");

      if (dateMeta) {
        const parsed = new Date(dateMeta);
        if (!isNaN(parsed.getTime())) {
          extractedPublishedAt = parsed;
        }
      }

      // ─── Robust Regex parse for Vietnamese dates ───
      if (!extractedPublishedAt) {
        const dateText = 
          dateMeta || 
          $(".header-content .date").text() || 
          $(".date").text() || 
          $(".time").text() || 
          $(".author-time").text() ||
          $(".bread-crumb-detail__time").text() ||
          $(".the-article-publish").text() ||
          $("[class*='time']").first().text() ||
          $("[class*='date']").first().text();
          
        if (dateText) {
          let dateFound = false;
          let day = 1, month = 0, year = new Date().getFullYear();
          const dateMatchVi = dateText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          const dateMatchEn = dateText.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
          
          if (dateMatchVi) {
            day = parseInt(dateMatchVi[1], 10);
            month = parseInt(dateMatchVi[2], 10) - 1;
            year = parseInt(dateMatchVi[3], 10);
            dateFound = true;
          } else if (dateMatchEn) {
            year = parseInt(dateMatchEn[1], 10);
            month = parseInt(dateMatchEn[2], 10) - 1;
            day = parseInt(dateMatchEn[3], 10);
            dateFound = true;
          }
          
          if (dateFound) {
            let hour = 0, minute = 0;
            const timeMatch = dateText.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
              hour = parseInt(timeMatch[1], 10);
              minute = parseInt(timeMatch[2], 10);
            }
            const parsed = new Date(year, month, day, hour, minute);
            if (!isNaN(parsed.getTime())) {
              extractedPublishedAt = parsed;
            }
          }
        }
      }

      ogImage = $('meta[property="og:image"]').attr("content") || "";
      if (ogImage && ogImage.startsWith("http")) {
        extractedImages.push({ url: ogImage, description: "Ảnh đại diện bài viết" });
      }

      // Giới hạn vùng lấy ảnh để tránh logo, quảng cáo, sidebar
      const articleContainer = $("article, .fck_detail, .post-content, #main-detail, .article-content, .detail-content, .content, #content, .main-content, .post-body, .entry-content, main").first();
      
      let imgElements;
      if (articleContainer.length > 0) {
        imgElements = articleContainer.find("img");
      } else {
        // Fallback an toàn: chỉ lấy ảnh nằm trong thẻ p, figure, hoặc các class chứa chữ post/article
        imgElements = $("figure img, p img, [class*='post'] img, [class*='article'] img, [class*='content'] img");
      }

      imgElements.each((_, el) => {
        let src = $(el).attr("data-src") || $(el).attr("data-original") || $(el).attr("src") || "";
        
        // Sửa lỗi URL tương đối (relative path)
        if (src.startsWith("//")) {
          src = "https:" + src;
        } else if (src.startsWith("/") && !src.startsWith("//")) {
          try {
            const urlObj = new URL(url);
            src = urlObj.origin + src;
          } catch(e) {}
        }

        const alt = $(el).attr("alt") || "";
        const figcaption = $(el).closest("figure").find("figcaption").text().trim();
        const customCaption = $(el).closest("table, div, figure").find(".Image, .fig, .caption, .description, p:last-child").text().trim();
        const description = (figcaption || customCaption || alt).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        
        // Lọc kỹ các ảnh rác, logo, banner, tracking pixel và 18+/Ads
        const srcLower = src.toLowerCase();
        const altLower = description.toLowerCase();
        const isUnsafe = /nsfw|porn|sex|nude|naked|adult|xxx|onlyfans|xvideos|escort|hookup|babes|bikini|model|girl|hot|sexy|boobs|ass|tits|scandal|nguc|vu|mong|18\+|gai|bikini|noi-y|do-lot|casino|betting|gamble|loto|ads|adserving|taboola|outbrain|mgid|admicro|eclick|adbox/i.test(srcLower) || /nsfw|porn|sex|nude|naked|adult|xxx|onlyfans|xvideos|escort|hookup|babes|bikini|model|girl|hot|sexy|boobs|ass|tits|scandal|nguc|vu|mong|18\+|gai|bikini|noi-y|do-lot|casino/i.test(altLower);

        if (
          src.startsWith("http") && 
          !srcLower.includes("pixel") && 
          !srcLower.includes("icon") && 
          !srcLower.includes("graphics") && 
          !srcLower.includes("logo") && 
          !srcLower.includes("banner") && 
          !srcLower.endsWith(".svg") &&
          src.length > 20 &&
          !isUnsafe
        ) {
          // Bọc qua weserv.nl proxy để lách luật chống hotlink (403 Forbidden)
          const urlWithoutProtocol = src.replace(/^https?:\/\//, "");
          const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(urlWithoutProtocol)}`;
          
          if (!extractedImages.find((img) => img.url === proxiedUrl)) {
            extractedImages.push({ url: proxiedUrl, description });
          }
        }
      });
      $("script, style, nav, header, footer, iframe, noscript, aside, .author, .author-name, .tac-gia, .nguoi-viet, .related-news, .tin-lien-quan, .tags, .box-tags, .comments, .sidebar, .share, .social, [class*='author'], [class*='related']").remove();
      
      // Xoá thẻ p cuối cùng nếu nó ngắn (dưới 15 từ) vì thường đó là chữ ký tác giả/nguồn báo
      const pElements = $("p");
      if (pElements.length > 0) {
        const lastP = pElements.last();
        if (lastP.text().trim().split(/\s+/).length < 15 && lastP.find("img").length === 0) {
          lastP.remove();
        }
      }

      sourceContent = $("p, h1, h2, h3, h4, h5, h6").map((_, el) => $(el).text()).get().join("\n");
      if (!sourceContent || sourceContent.length < 100) {
        sourceContent = $("body").text().replace(/\s+/g, " ").trim();
      }
    }
    // ─── BƯỚC 1.5: AI RESEARCH (TÌM KIẾM MỞ RỘNG TRÊN MẠNG) ───
    const queryForSearch = title || sourceTitle || "";
    let researchInfo = "";
    let externalImages: any[] = [];
    
    if (queryForSearch) {
      console.log(`[AI Research] Đang tìm kiếm thông tin mở rộng cho: ${queryForSearch}...`);
      
      const info = await searchWebForInfo(queryForSearch);
      researchInfo = info;
      console.log(`[AI Research] Đã lấy được ${info.split('\n').length - 1} nguồn thông tin.`);
    }

    // Xác định ảnh Thumbnail trước để loại trừ khỏi bài viết (tránh lặp)
    let mainImageUrl = ogImage || extractedImages[0]?.url || "";

    // Deduplicate images by URL before mapping
    const seenUrls = new Set<string>();
    if (mainImageUrl) {
      // Thêm ảnh thum vào seenUrls để filter bên dưới sẽ bỏ qua nó
      seenUrls.add(mainImageUrl);
    }
    const uniqueImages = [...extractedImages, ...externalImages].filter(img => {
      if (!img.url || seenUrls.has(img.url)) return false;
      seenUrls.add(img.url);
      return true;
    });
    let finalImages = uniqueImages;
    
    // Ánh xạ URL dài thành ID ngắn để tiết kiệm Token đầu vào và đầu ra
    const imageMap: Record<string, string> = {};
    const shortFinalImages = finalImages.map((img, idx) => {
      const shortId = `IMG_${idx}`;
      imageMap[shortId] = img.url;
      return { id: shortId, description: img.description };
    });

    // ─── BƯỚC 2: Tạo prompt (Sử dụng Tiếng Anh để tiết kiệm Token) ───
    const prompt = `
      You are a Senior Sports Editor and a world-class SEO Expert.
      Below is a raw sports article. Your task is to rewrite it into an engaging, natural, insightful, and unique SEO article.
      
      CONTENT REQUIREMENTS:
      YOU MUST WRITE THE FINAL ARTICLE ENTIRELY IN VIETNAMESE (Tiếng Việt).
      Your task is to read the source content and additional info, synthesize it, and write a COMPLETE, UNIQUE, and IN-DEPTH football article.

      PROCESSING LAYER:
      1. Write smoothly, naturally, and with deep analysis (avoid dry bullet points).
      2. Synthesize info from the source article AND additional internet info to make the article as rich as possible.
      3. Absolutely DO NOT repeat content or sentences. If the source is short, expand the analysis instead of repeating.
      4. FILTER TRASH INFO: DO NOT include the original author or reporter names (e.g., "Hoàng An", "according to Reuters"). NEVER SIGN THE ARTICLE OR CITE SOURCES AT THE END. Remove junk paragraphs like "Related news", "Read more".
      ${isForeign ? "5. THIS IS FOREIGN NEWS. YOU MUST TRANSLATE AND REWRITE THIS ENTIRE ARTICLE INTO 100% NATURAL VIETNAMESE." : ""}

      FLAVOR & TONE:
      - Tone: Captivating, sharp, professional yet entertaining.
      - Flavor: Add tactical analysis, form predictions, or expert commentary on coaches/players instead of just reporting facts.
      - Personal Opinion: Embed subjective observations to create interesting debates for readers.
      - Formatting: Use appropriate Emojis (⚽, 🔥, 🏆...) to emphasize key points.
      
      STRICT SEO REQUIREMENTS (MUST FOLLOW 100%):
      1. FOCUS KEYWORD: Identify 1 main focus keyword. It MUST appear in:
         - The article Title and seoTitle.
         - The Excerpt and seoDescription.
         - The seoUrl.
         - The first 10% of the article content.
         - The "alt" attribute of at least 1 image.
      2. KEYWORD DENSITY: Distribute the keyword naturally (1.5% - 2.5%). DO NOT spam.
      3. STANDARD LENGTH:
         - seoTitle length: 40 to 60 characters.
         - seoDescription length: 120 to 156 characters.
         - Article content: Minimum 350 words.
      4. STRUCTURE & LINKS:
         - Headings: Must include <h2> and <h3> tags logically to break up text.
         - Paragraphs: Short, readable, 3-4 sentences per paragraph.
         - Internal Link: Include a link to internal pages (e.g., <a href="https://anvsport.vn/bong-da">Bóng đá</a>).
         - Outbound Link: Include at least 1 external citation (e.g., <a href="https://en.wikipedia.org" rel="nofollow">Wikipedia</a>).
         - Related Info Section: ALWAYS add a concluding section at the bottom (e.g., "Góc nhìn thú vị", "Tin liên quan", or "Có thể bạn chưa biết") using the provided ADDITIONAL REFERENCE INFO or your own sports knowledge to connect the main topic with relevant fun facts, historical context, or related events.
       5. IMAGES & ALT TEXT: 
          - STRICT IMAGE FILTERING: Only select images from the provided list that are truly relevant.
          - IGNORE junk images. Each image URL can be used MAXIMUM 1 TIME.
          - ALL <img> tags MUST have an alt attribute.
          - Use EXACTLY the "id" field (e.g. IMG_0, IMG_1) as the src value. Example:
            <p><img src="IMG_0" alt="description with keyword" referrerpolicy="no-referrer"></p><p><em>[Caption]</em></p>

      INPUT DATA:
      - Suggested Title: ${title}
      - Source Content: ${sourceContent.substring(0, 2000)}
      
      ADDITIONAL REFERENCE INFO:
      ${researchInfo ? researchInfo.substring(0, 400) : "None"}

       AVAILABLE IMAGES LIST (use the exact "id" value as the src attribute in img tags):
       ${JSON.stringify(shortFinalImages)}

       CRITICAL IMAGE RULE: To embed an image, use EXACTLY the "id" value from the list above as the src.
       Example: if the list contains {"id":"IMG_0","description":"..."}, you MUST write: <img src="IMG_0" ...>
       DO NOT invent image URLs. DO NOT write "IMAGE_URL", "IMAGE 0 URL" or any placeholder text.
      
      RETURN EXACTLY THIS JSON FORMAT (NO markdown wrappers, NO extra text, ALL VALUES IN VIETNAMESE EXCEPT URL):
      {
        "title": "Catchy title (under 80 chars)",
        "excerpt": "Short engaging sapo (under 200 chars)",
        "content": "Complete HTML content (over 400 words, MUST CONTAIN AT LEAST 2 <img> tags if available)",
        "tags": ["FOCUS KEYWORD", "tag 1", "tag 2"],
        "seoTitle": "SEO title 45-60 chars",
        "seoDescription": "SEO description 130-150 chars",
        "seoKeywords": "Focus keyword",
        "seoUrl": "focus-keyword-url"
      }
    `;

    // ─── BƯỚC 3: Gọi AI Box (CÓ FALLBACK VÀ TIMEOUT CHỐNG TREO) ───
    const systemInstruction = 'You are a highly capable AI assistant that outputs structured JSON data for sports news articles. CRITICAL INSTRUCTION: You MUST wrap all content inside valid HTML and you MUST INCLUDE AT LEAST 2 <img> tags (from the provided image list) in the "content" field if the list has at least 2 images. If you fail to include enough <img> tags, your output will be rejected.';
    
    let resultText = await generateWithFallback(prompt, systemInstruction, true);

    // ─── BƯỚC 4: Parse và trả về kết quả ───
    let result: any = {};
    try {
      // Làm sạch dữ liệu rác: xoá các ký tự xuống dòng (literal newlines) làm hỏng cấu trúc JSON
      const cleanJsonStr = resultText.replace(/\n/g, " ").replace(/\r/g, "").trim();
      result = JSON.parse(cleanJsonStr || "{}");
    } catch (e) {
      console.warn("Lỗi parse JSON từ AI:", resultText);
      throw new Error("AI provider returned invalid JSON. Retrying...");
    }

    if (!result.title || !result.content || result.title.trim() === "" || result.content.trim() === "") {
      console.warn("[AI Validation] Bài viết rỗng hoặc thiếu tiêu đề! Bắt buộc AI thử lại...");
      throw new Error("AI provider returned empty title or content. Retrying...");
    }
    
    // Kiểm tra tính toàn vẹn: nếu có cung cấp ảnh mà AI lại "quên" chèn đủ <img, bắt lỗi để ép retry
    const imgCount = (result.content.match(/<img/g) || []).length;
    if (finalImages.length > 0 && imgCount === 0) {
      console.warn("[AI Validation] Bài viết bị thiếu ảnh! Bắt buộc AI thử lại...");
      throw new Error("AI provider generated article without images. Retrying...");
    }
    if (finalImages.length >= 2 && imgCount < 2) {
      console.warn(`[AI Validation] Bài viết chỉ có ${imgCount} ảnh trong khi yêu cầu ít nhất 2 ảnh! Bắt buộc AI thử lại...`);
      throw new Error("AI provider generated article with insufficient images. Retrying...");
    }
    
    // Log quá trình CoT của AI ra terminal để theo dõi
    if (result.best_version && result.reasoning) {
      console.log(`[AI CoT] Đã chọn Version ${result.best_version}`);
      console.log(`[AI CoT] Lý do: ${result.reasoning}`);
    }

    // ─── BƯỚC 5: Tải hình ảnh lên Supabase và phục hồi URL ───
    let contentHtml = result.content || "<p>Không thể tạo nội dung.</p>";
    
    // Phục hồi lại các URL dài từ IMG_ID
    Object.entries(imageMap).forEach(([shortId, realUrl]) => {
      contentHtml = contentHtml.replace(new RegExp(shortId, 'g'), realUrl);
    });

    // Strip out any <img> tags that still have placeholder/invalid src (not starting with http)
    const $cleanup = cheerio.load(contentHtml, null, false);
    const usedSrcs = new Set<string>();
    $cleanup('img').each((_, el) => {
      const src = $cleanup(el).attr('src') || '';
      if (!src.startsWith('http')) {
        // Remove broken img and its adjacent caption
        $cleanup(el).closest('p').next('p').find('em').parent().remove();
        $cleanup(el).closest('p').remove();
      } else if (usedSrcs.has(src)) {
        // Remove duplicate image
        $cleanup(el).closest('p').next('p').find('em').parent().remove();
        $cleanup(el).closest('p').remove();
      } else {
        usedSrcs.add(src);
      }
    });
    contentHtml = $cleanup.html() || contentHtml;

    const uploadCache = new Map<string, string>();
    const originalMainImageUrl = mainImageUrl;

    // Upload Main Image
    if (mainImageUrl) {
      const spUrl = await uploadToSupabase(mainImageUrl);
      if (spUrl) {
        uploadCache.set(mainImageUrl, spUrl);
        mainImageUrl = spUrl;
      }
    }

    // Upload Content Images
    if (contentHtml && contentHtml !== "<p>Không thể tạo nội dung.</p>") {
      const $content = cheerio.load(contentHtml, null, false);
      const imgTags = $content('img').toArray();
      
      // Xoá ảnh đầu tiên trong bài viết nếu nó trùng khớp với ảnh đại diện
      if (imgTags.length > 0 && originalMainImageUrl) {
        const firstImgSrc = $content(imgTags[0]).attr('src');
        if (firstImgSrc === originalMainImageUrl || firstImgSrc === mainImageUrl) {
          $content(imgTags[0]).closest('p').next('p').find('em').parent().remove();
          $content(imgTags[0]).closest('p').remove();
          imgTags.shift();
        }
      }
      
      await Promise.all(imgTags.map(async (img) => {
        const src = $content(img).attr('src');
        if (src && src.startsWith('http')) {
          let spUrl = uploadCache.get(src);
          if (!spUrl) {
            spUrl = await uploadToSupabase(src) || undefined;
            if (spUrl) uploadCache.set(src, spUrl);
          }
          if (spUrl) {
            $content(img).attr('src', spUrl);
          }
        }
      }));
      
      contentHtml = $content.html() || contentHtml;
    }



    return {
      success: true,
      data: {
        title: result.title || title,
        excerpt: result.excerpt || "",
        content: contentHtml,
        imageUrl: mainImageUrl,
        tags: result.tags || [],
        seoTitle: result.seoTitle || "",
        seoDescription: result.seoDescription || "",
        seoKeywords: result.seoKeywords || "",
        seoUrl: result.seoUrl || "",
        publishedAt: extractedPublishedAt
      },
    };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return {
      success: false,
      error: error.message || "Đã xảy ra lỗi khi tạo bài viết bằng AI",
    };
  }
}

export async function searchPosts(query: string) {
  if (!query || query.trim().length === 0) return [];
  const isNumeric = /^\d+$/.test(query);
  try {
    return await prisma.post.findMany({
      where: {
        OR: [
          ...(isNumeric ? [{ id: parseInt(query, 10) }] : []),
          { title: { contains: query } },
          { metadata: { contains: query } },
        ],
      },
      select: { id: true, title: true, status: true },
      take: 10,
      orderBy: { id: "desc" },
    });
  } catch (error) {
    console.error("Lỗi searchPosts:", error);
    return [];
  }
}

export async function extractLinksFromCategory(url: string) {
  try {
    const urlObj = new URL(url);
    const origin = urlObj.origin;

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let links: string[] = [];
    $("a").each((_, el) => {
      let href = $(el).attr("href");
      if (!href) return;
      
      // Chuyển đổi link tương đối (VD: /the-thao/bai-viet.html) thành tuyệt đối
      if (href.startsWith("/")) {
        href = origin + href;
      }
      
      // Loại bỏ các phần hashtag (#box_comment_vne, v.v.) để tránh trùng lặp bài viết
      href = href.split("#")[0];

      if (href.startsWith("http") && href.includes("-") && (href.includes(".html") || href.includes(".htm"))) {
        if (!links.includes(href)) {
          links.push(href);
        }
      }
    });
    
    // Giới hạn tối đa 50 link mỗi lần quét
    return { success: true, links: links.slice(0, 50) };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi quét chuyên mục" };
  }
}

export async function bulkCrawlAndSavePost(url: string, status: string = "DRAFT", categorySlug?: string, isForeign: boolean = false) {
  try {
    // ─── KIỂM TRA TRÙNG LẶP LINK TRƯỚC KHI CRAWL ───
    const existingPost = await prisma.post.findFirst({
      where: {
        metadata: {
          contains: `"aiUrl":"${url}"`
        }
      }
    });

    if (existingPost) {
      return { success: false, error: "Link này đã được Crawl trước đó" };
    }

    const aiResult = await generateArticleWithAI("", url, isForeign);
    if (!aiResult.success || !aiResult.data) {
      throw new Error(aiResult.error || "Lỗi sinh nội dung AI");
    }

    const { data } = aiResult;
    
    const seoResult = evaluateSeo({
      title: data.title || "Bài viết không tiêu đề",
      excerpt: data.excerpt || "",
      content: data.content || "",
      keywords: data.seoKeywords || "",
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoUrl: data.seoUrl
    });

    const wordCount = data.content ? data.content.replace(/<[^>]*>?/gm, " ").trim().split(/\s+/).filter(w => w.length > 0).length : 0;

    const metadata = JSON.stringify({
      seoKeywords: data.seoKeywords || "",
      seoTitle: data.seoTitle || "",
      seoDescription: data.seoDescription || "",
      seoUrl: data.seoUrl || "",
      source: "Tong hop",
      aiUrl: url,
      postCategory: "STANDARD",
      mainCategory: categorySlug || "",
      tags: data.tags || [],
      seoScore: seoResult.score,
      wordCount: wordCount
    });

    let categoryConnectCreate: any = undefined;
    if (categorySlug) {
      categoryConnectCreate = { connect: [{ slug: categorySlug }] };
    }

    const post = await prisma.post.create({
      data: {
        title: data.title || "Bài viết không tiêu đề",
        excerpt: data.excerpt || "",
        content: data.content || "",
        imageUrl: data.imageUrl || "",
        status: status,
        type: "STANDARD",
        metadata: metadata,
        isAiGenerated: true,
        ...(data.publishedAt && { 
          publishedAt: data.publishedAt,
          createdAt: data.publishedAt 
        }),
        ...(categoryConnectCreate && { categories: categoryConnectCreate })
      }
    });

    return { success: true, post: { id: post.id, title: post.title } };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi lưu bài viết" };
  }
}

export async function getPaginatedPosts(page: number, status: string, search: string) {
  const limit = 25;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status !== "ALL") {
    if (status === "PENDING") {
      where.status = { in: ["PENDING_EDITOR", "PENDING_PUBLISH"] };
    } else {
      where.status = status;
    }
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
    ];
    const searchId = parseInt(search);
    if (!isNaN(searchId)) {
      where.OR.push({ id: searchId });
    }
  }

  const [posts, totalFilteredCount] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        excerpt: true,
        imageUrl: true,
        status: true,
        type: true,
        author: true,
        createdAt: true,
        metadata: true,
        categories: true
      }
    }),
    prisma.post.count({ where }),
  ]);

  const optimizedPosts = posts.map(post => {
    let parsedMetadata: any = {};
    try {
      if (post.metadata) parsedMetadata = JSON.parse(post.metadata);
    } catch (e) {}

    let seoScore = parsedMetadata.seoScore !== undefined ? parsedMetadata.seoScore : 70;
    let wordCount = parsedMetadata.wordCount !== undefined ? parsedMetadata.wordCount : 250;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      imageUrl: post.imageUrl,
      status: post.status,
      type: post.type,
      author: post.author,
      createdAt: post.createdAt.toISOString(),
      categories: post.categories,
      metadata: post.metadata,
      seoScore: seoScore,
      wordCount: wordCount
    };
  });

  return {
    success: true,
    posts: optimizedPosts,
    totalCount: totalFilteredCount
  };
}
