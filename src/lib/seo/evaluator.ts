import { SEO_RULES } from "./config";

export interface SeoCheck {
  id: string;
  label: string;
  status: "pass" | "warning" | "error";
  message: string;
}

export interface SeoInput {
  title: string;
  excerpt: string;
  content: string; // HTML string
  keywords: string; // comma separated
  seoTitle?: string;
  seoDescription?: string;
  seoUrl?: string;
  imageUrl?: string;
  fbImageUrl?: string;
}

export interface SeoResult {
  score: number;
  checks: SeoCheck[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

function getWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function countOccurrences(text: string, target: string): number {
  if (!target || target.trim().length === 0) return 0;
  const regex = new RegExp(target.trim(), "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function evaluateSeo(input: SeoInput): SeoResult {
  let score = 0;
  const checks: SeoCheck[] = [];

  // --- PRE-PROCESSING ---
  const titleToCheck = input.seoTitle || input.title || "";
  const descToCheck = input.seoDescription || input.excerpt || "";
  const plainContent = stripHtml(input.content);
  const totalWords = getWordCount(plainContent);
  let keywordsList: string[] = [];
  if (Array.isArray(input.keywords)) {
    keywordsList = input.keywords.map(k => String(k).trim().toLowerCase()).filter(k => k.length > 0);
  } else if (typeof input.keywords === "string") {
    keywordsList = input.keywords.split(",").map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
  }
  const focusKeyword = keywordsList.length > 0 ? keywordsList[0] : "";

  // ==========================================
  // 1. TỪ KHÓA TRỌNG TÂM (Focus Keyword) - 25đ
  // ==========================================
  let keywordScore = 0;
  if (!focusKeyword) {
    checks.push({ id: "fk_missing", label: "Từ khóa chính", status: "error", message: "Chưa nhập từ khóa SEO" });
  } else {
    // 1.1 Keyword in Title (5đ)
    if (titleToCheck.toLowerCase().includes(focusKeyword)) {
      keywordScore += 5;
      if (titleToCheck.toLowerCase().startsWith(focusKeyword)) {
        checks.push({ id: "fk_title", label: "Từ khóa trong Tiêu đề", status: "pass", message: "Có xuất hiện ở đầu tiêu đề" });
      } else {
        checks.push({ id: "fk_title", label: "Từ khóa trong Tiêu đề", status: "warning", message: "Có xuất hiện, nhưng nên đặt ở đầu câu" });
      }
    } else {
      checks.push({ id: "fk_title", label: "Từ khóa trong Tiêu đề", status: "error", message: "Chưa có từ khóa chính" });
    }

    // 1.2 Keyword in Description (5đ)
    if (descToCheck.toLowerCase().includes(focusKeyword)) {
      keywordScore += 5;
      checks.push({ id: "fk_desc", label: "Từ khóa trong Mô tả", status: "pass", message: "Có xuất hiện" });
    } else {
      checks.push({ id: "fk_desc", label: "Từ khóa trong Mô tả", status: "error", message: "Chưa có từ khóa chính" });
    }

    // 1.3 Keyword in URL (5đ)
    if ((input.seoUrl || "").toLowerCase().includes(focusKeyword.replace(/\s+/g, '-'))) {
      keywordScore += 5;
      checks.push({ id: "fk_url", label: "Từ khóa trong URL", status: "pass", message: "Có xuất hiện" });
    } else {
      checks.push({ id: "fk_url", label: "Từ khóa trong URL", status: "warning", message: "Chưa có từ khóa chính" });
    }

    // 1.4 Keyword Density & First Paragraph (10đ)
    const occurrences = countOccurrences(plainContent, focusKeyword);
    const density = totalWords > 0 ? (occurrences * getWordCount(focusKeyword) / totalWords) * 100 : 0;
    
    if (density >= SEO_RULES.KEYWORD_MIN_DENSITY && density <= SEO_RULES.KEYWORD_MAX_DENSITY) {
      keywordScore += 7;
      checks.push({ id: "fk_density", label: "Mật độ từ khóa", status: "pass", message: `Chuẩn mực (${density.toFixed(2)}%)` });
    } else if (density > SEO_RULES.KEYWORD_MAX_DENSITY) {
      keywordScore += 3;
      checks.push({ id: "fk_density", label: "Mật độ từ khóa", status: "warning", message: `Quá cao (${density.toFixed(2)}%), coi chừng Spam` });
    } else if (density > 0) {
      keywordScore += 3;
      checks.push({ id: "fk_density", label: "Mật độ từ khóa", status: "warning", message: `Quá thấp (${density.toFixed(2)}%)` });
    } else {
      checks.push({ id: "fk_density", label: "Mật độ từ khóa", status: "error", message: "Từ khóa không có trong bài" });
    }

    // 1.5 First 100 words
    const first100Words = plainContent.split(/\s+/).slice(0, 100).join(" ");
    if (first100Words.toLowerCase().includes(focusKeyword)) {
      keywordScore += 3;
      checks.push({ id: "fk_intro", label: "Từ khóa đoạn đầu", status: "pass", message: "Có trong 10% đầu bài viết" });
    } else {
      checks.push({ id: "fk_intro", label: "Từ khóa đoạn đầu", status: "warning", message: "Chưa xuất hiện trong phần giới thiệu" });
    }
  }
  score += Math.min(keywordScore, SEO_RULES.WEIGHT_FOCUS_KEYWORD);


  // ==========================================
  // 2. BASIC META (Tiêu đề, Mô tả, Độ dài) - 20đ
  // ==========================================
  let basicScore = 0;
  
  // Title Length (5đ)
  const titleLen = titleToCheck.length;
  if (titleLen >= SEO_RULES.TITLE_MIN_LENGTH && titleLen <= SEO_RULES.TITLE_MAX_LENGTH) {
    basicScore += 5;
    checks.push({ id: "meta_title", label: "Độ dài Tiêu đề", status: "pass", message: `Tuyệt vời (${titleLen} ký tự)` });
  } else {
    basicScore += 2;
    checks.push({ id: "meta_title", label: "Độ dài Tiêu đề", status: "warning", message: `${titleLen} ký tự (Khuyến nghị: 40-60)` });
  }

  // Desc Length (5đ)
  const descLen = descToCheck.length;
  if (descLen >= SEO_RULES.EXCERPT_MIN_LENGTH && descLen <= SEO_RULES.EXCERPT_MAX_LENGTH) {
    basicScore += 5;
    checks.push({ id: "meta_desc", label: "Độ dài Mô tả", status: "pass", message: `Vừa vặn (${descLen} ký tự)` });
  } else {
    basicScore += 2;
    checks.push({ id: "meta_desc", label: "Độ dài Mô tả", status: "warning", message: `${descLen} ký tự (Khuyến nghị: 120-156)` });
  }

  // Content Length (10đ)
  if (totalWords >= SEO_RULES.CONTENT_MIN_WORDS) {
    basicScore += 5 + (5 * Math.min(1, totalWords / SEO_RULES.CONTENT_IDEAL_WORDS));
    checks.push({ id: "meta_content", label: "Độ dài bài viết", status: "pass", message: `${totalWords} từ` });
  } else {
    basicScore += 2;
    checks.push({ id: "meta_content", label: "Độ dài bài viết", status: "error", message: `Quá ngắn (${totalWords} từ. Tối thiểu 300)` });
  }
  score += Math.min(basicScore, SEO_RULES.WEIGHT_BASIC_META);


  // ==========================================
  // 3. MEDIA & SOCIAL - 15đ
  // ==========================================
  let mediaScore = 0;
  
  if (input.imageUrl) {
    mediaScore += 5;
    checks.push({ id: "media_thumb", label: "Ảnh đại diện (Thumb)", status: "pass", message: "Đã thiết lập" });
  } else {
    checks.push({ id: "media_thumb", label: "Ảnh đại diện (Thumb)", status: "error", message: "Bắt buộc phải có" });
  }

  const imgRegex = /<img\s+([^>]*?)>/gi;
  const images = [...input.content.matchAll(imgRegex)];
  
  if (images.length > 0) {
    mediaScore += 3;
    let missingAlt = 0;
    let keywordInAlt = false;
    
    images.forEach(match => {
      const attrs = match[1];
      const altMatch = attrs.match(/alt=(["'])(.*?)\1/i);
      if (!altMatch || !altMatch[2] || altMatch[2].trim() === "") {
        missingAlt++;
      } else if (focusKeyword && altMatch[2].toLowerCase().includes(focusKeyword)) {
        keywordInAlt = true;
      }
    });

    if (missingAlt === 0) {
      mediaScore += 4;
      checks.push({ id: "media_alt", label: "Thuộc tính Alt", status: "pass", message: "Tất cả ảnh đều có Alt" });
    } else {
      checks.push({ id: "media_alt", label: "Thuộc tính Alt", status: "warning", message: `${missingAlt}/${images.length} ảnh thiếu Alt text` });
    }

    if (keywordInAlt) {
      mediaScore += 3;
      checks.push({ id: "media_alt_kw", label: "Từ khóa trong Alt", status: "pass", message: "Có xuất hiện" });
    } else {
      checks.push({ id: "media_alt_kw", label: "Từ khóa trong Alt", status: "warning", message: "Chưa có từ khóa chính" });
    }
  } else {
    checks.push({ id: "media_content", label: "Hình ảnh nội dung", status: "warning", message: "Chưa có hình ảnh minh họa" });
  }
  score += Math.min(mediaScore, SEO_RULES.WEIGHT_MEDIA);


  // ==========================================
  // 4. LIÊN KẾT (LINKS) - 15đ
  // ==========================================
  let linkScore = 0;
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
  const links = [...input.content.matchAll(linkRegex)];
  let internal = 0;
  let external = 0;

  links.forEach(match => {
    const url = match[2];
    if (url.startsWith("http") && !url.includes("anvsport.com") && !url.includes("localhost")) {
      external++;
    } else {
      internal++;
    }
  });

  if (internal > 0) {
    linkScore += 7.5;
    checks.push({ id: "link_internal", label: "Liên kết nội bộ (Internal)", status: "pass", message: `Tốt (${internal} link)` });
  } else {
    checks.push({ id: "link_internal", label: "Liên kết nội bộ (Internal)", status: "error", message: "Thiếu liên kết nội bộ" });
  }

  if (external > 0) {
    linkScore += 7.5;
    checks.push({ id: "link_external", label: "Liên kết ngoài (Outbound)", status: "pass", message: `Tốt (${external} link)` });
  } else {
    checks.push({ id: "link_external", label: "Liên kết ngoài (Outbound)", status: "warning", message: "Nên thêm liên kết trích dẫn ngoài" });
  }
  score += Math.min(linkScore, SEO_RULES.WEIGHT_LINKS);


  // ==========================================
  // 5. READABILITY - 25đ
  // ==========================================
  let readScore = 25; // Trừ dần

  // Paragraph length
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = [...input.content.matchAll(pRegex)];
  let hasLongParagraph = false;
  paragraphs.forEach(match => {
    const pText = stripHtml(match[1]);
    if (getWordCount(pText) > SEO_RULES.PARAGRAPH_MAX_WORDS) {
      hasLongParagraph = true;
    }
  });

  if (hasLongParagraph) {
    readScore -= 10;
    checks.push({ id: "read_p", label: "Độ dài đoạn văn", status: "warning", message: `Có đoạn quá dài (>${SEO_RULES.PARAGRAPH_MAX_WORDS} từ)` });
  } else if (paragraphs.length > 0) {
    checks.push({ id: "read_p", label: "Độ dài đoạn văn", status: "pass", message: "Dễ đọc, phân tách tốt" });
  }

  // Heading distribution
  const hRegex = /<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings = [...input.content.matchAll(hRegex)];
  if (totalWords > 300 && headings.length === 0) {
    readScore -= 15;
    checks.push({ id: "read_h", label: "Phân bổ Heading", status: "error", message: "Bài quá dài nhưng thiếu H2/H3" });
  } else {
    // Check keyword in Heading
    let keywordInH = false;
    headings.forEach(match => {
      if (focusKeyword && stripHtml(match[2]).toLowerCase().includes(focusKeyword)) {
        keywordInH = true;
      }
    });

    if (headings.length > 0) {
      if (keywordInH) {
        checks.push({ id: "read_h", label: "Phân bổ Heading", status: "pass", message: "Tốt, có chứa từ khóa" });
      } else {
        readScore -= 5;
        checks.push({ id: "read_h", label: "Phân bổ Heading", status: "warning", message: "Các Heading chưa chứa từ khóa" });
      }
    }
  }
  score += Math.max(0, readScore);

  return {
    score: Math.round(score),
    checks
  };
}
