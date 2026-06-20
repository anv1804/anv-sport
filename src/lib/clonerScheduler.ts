import prisma from './prisma';
import { extractLinksFromCategory, bulkCrawlAndSavePost } from '@/app/admin/(dashboard)/posts/actions';
import * as cheerio from 'cheerio';

let isCrawlInProgress = false;

// Helper to parse date from a given URL to check if it's within the days limit
export async function isArticleWithinDateLimit(url: string, daysLimit: number): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract publication date (similar to generateArticleWithAI logic)
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

    let publishedAt: Date | null = null;
    if (dateMeta) {
      const parsed = new Date(dateMeta);
      if (!isNaN(parsed.getTime())) {
        publishedAt = parsed;
      }
    }

    if (!publishedAt) {
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
            publishedAt = parsed;
          }
        }
      }
    }

    if (publishedAt) {
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - publishedAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= daysLimit;
    }

    // Default to true if date cannot be parsed, to be safe
    return true;
  } catch (error) {
    console.error(`[Auto Cloner] Error parsing date for ${url}:`, error);
    return true;
  }
}

// Core function to execute cloning for all active sources
export async function executeAutoCrawl() {
  if (isCrawlInProgress) {
    console.log("[Auto Cloner] Crawl already in progress. Skipping execution.");
    return;
  }

  isCrawlInProgress = true;
  console.log("[Auto Cloner] Starting automated crawl execution...");

  try {
    const activeSources = await prisma.autoClonerSource.findMany({
      where: { isActive: true },
      include: { category: true }
    });

    console.log(`[Auto Cloner] Found ${activeSources.length} active source(s) to process.`);

    for (const source of activeSources) {
      console.log(`[Auto Cloner] Processing source: ${source.url} for category: ${source.category.name}`);
      
      const extractResult = await extractLinksFromCategory(source.url);
      if (!extractResult.success || !extractResult.links) {
        console.error(`[Auto Cloner] Failed to extract links for ${source.url}: ${extractResult.error}`);
        continue;
      }

      console.log(`[Auto Cloner] Extracted ${extractResult.links.length} links. Checking for new articles...`);
      let crawledCount = 0;

      for (const link of extractResult.links) {
        // 1. Check duplicate
        const existingPost = await prisma.post.findFirst({
          where: {
            metadata: {
              contains: `"aiUrl":"${link}"`
            }
          }
        });

        if (existingPost) {
          continue; // Skip already crawled
        }

        // 2. Check date limit
        const withinLimit = await isArticleWithinDateLimit(link, source.daysLimit);
        if (!withinLimit) {
          console.log(`[Auto Cloner] Skipping link ${link} as it is older than ${source.daysLimit} days.`);
          continue;
        }

        // 3. Crawl and save
        console.log(`[Auto Cloner] Crawling new article: ${link}`);
        const crawlResult = await bulkCrawlAndSavePost(link, "PUBLISHED", source.categorySlug, source.isForeign);
        if (crawlResult.success) {
          crawledCount++;
        } else {
          console.warn(`[Auto Cloner] Failed to crawl ${link}: ${crawlResult.error}`);
        }
      }

      // Update lastRunAt for this source
      await prisma.autoClonerSource.update({
        where: { id: source.id },
        data: { lastRunAt: new Date() }
      });

      console.log(`[Auto Cloner] Finished processing source: ${source.url}. Crawled ${crawledCount} new article(s).`);
    }
  } catch (error) {
    console.error("[Auto Cloner] Error during automated crawl:", error);
  } finally {
    isCrawlInProgress = false;
    console.log("[Auto Cloner] Automated crawl execution completed.");
  }
}

// Background scheduler checker loop
export function initClonerScheduler() {
  // Prevent multiple schedulers in dev hot-reloads
  if ((globalThis as any).clonerSchedulerInitialized) {
    return;
  }
  (globalThis as any).clonerSchedulerInitialized = true;

  console.log("[Auto Cloner] Background scheduler initialized.");

  // Check every 5 minutes
  setInterval(async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Target hours: 7, 12, 17, 22, 2
      const targetHours = [7, 12, 17, 22, 2];
      
      if (targetHours.includes(currentHour)) {
        // Format slot as YYYY-MM-DD-HH
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hourStr = String(currentHour).padStart(2, '0');
        const currentSlot = `${year}-${month}-${day}-${hourStr}`;

        // Get last run slot from Setting
        const lastRunSetting = await prisma.setting.findUnique({
          where: { key: 'AUTO_CLONER_LAST_RUN_SLOT' }
        });

        if (!lastRunSetting || lastRunSetting.value !== currentSlot) {
          console.log(`[Auto Cloner] Scheduler triggered for slot: ${currentSlot}`);
          
          // Save slot first to avoid double executions in quick succession
          if (lastRunSetting) {
            await prisma.setting.update({
              where: { key: 'AUTO_CLONER_LAST_RUN_SLOT' },
              data: { value: currentSlot }
            });
          } else {
            await prisma.setting.create({
              data: {
                key: 'AUTO_CLONER_LAST_RUN_SLOT',
                value: currentSlot,
                description: 'Lần cuối cùng hệ thống chạy quét tự động Cloner'
              }
            });
          }

          // Run crawling
          await executeAutoCrawl();
        }
      }
    } catch (err) {
      console.error("[Auto Cloner] Scheduler tick error:", err);
    }
  }, 5 * 60 * 1000); // 5 minutes
}
