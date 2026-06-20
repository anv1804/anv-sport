"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { executeAutoCrawl, isArticleWithinDateLimit } from "@/lib/clonerScheduler";
import { extractLinksFromCategory, bulkCrawlAndSavePost } from "@/app/admin/(dashboard)/posts/actions";

export async function getClonerSources() {
  try {
    return await prisma.autoClonerSource.findMany({
      include: {
        category: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error: any) {
    throw new Error(error.message || "Không thể tải danh sách cloner sources");
  }
}

export async function createClonerSource(formData: {
  url: string;
  categoryId: string;
  daysLimit: number;
  isForeign: boolean;
}) {
  const { url, categoryId, daysLimit, isForeign } = formData;

  if (!url || !categoryId) {
    throw new Error("Vui lòng nhập đầy đủ link nguồn và danh mục đích");
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new Error("Danh mục không tồn tại");
    }

    await prisma.autoClonerSource.create({
      data: {
        url,
        categoryId,
        categorySlug: category.slug,
        daysLimit: daysLimit || 7,
        isForeign: !!isForeign
      }
    });

    revalidatePath("/admin/auto-cloner");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi khi tạo cloner source");
  }
}

export async function updateClonerSource(
  id: string,
  formData: {
    url?: string;
    categoryId?: string;
    daysLimit?: number;
    isActive?: boolean;
    isForeign?: boolean;
  }
) {
  try {
    const data: any = { ...formData };

    if (formData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: formData.categoryId }
      });
      if (!category) {
        throw new Error("Danh mục không tồn tại");
      }
      data.categorySlug = category.slug;
    }

    await prisma.autoClonerSource.update({
      where: { id },
      data
    });

    revalidatePath("/admin/auto-cloner");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi khi cập nhật cloner source");
  }
}

export async function deleteClonerSource(id: string) {
  try {
    await prisma.autoClonerSource.delete({
      where: { id }
    });

    revalidatePath("/admin/auto-cloner");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi khi xóa cloner source");
  }
}

export async function triggerManualCrawl() {
  try {
    console.log("[Auto Cloner Actions] Manually triggered crawl started.");
    await executeAutoCrawl();
    revalidatePath("/admin/auto-cloner");
    revalidatePath("/admin/posts");
    revalidatePath("/");
    return { success: true, message: "Quá trình đồng bộ dữ liệu đã hoàn tất thành công!" };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi trong quá trình chạy crawl thủ công");
  }
}

function getNextPageUrl(url: string, pageNum: number): string {
  try {
    const urlObj = new URL(url);
    
    // Pattern 1: VnExpress style (e.g., /tin-tuc -> /tin-tuc-p2)
    if (urlObj.hostname.includes('vnexpress.net')) {
      let pathname = urlObj.pathname.replace(/-p\d+$/, '');
      return `${urlObj.origin}${pathname}-p${pageNum}${urlObj.search}`;
    }
    
    // Pattern 2: Query parameter style (e.g., ?page=2 or ?p=2)
    const searchParams = new URLSearchParams(urlObj.search);
    if (searchParams.has('page') || searchParams.has('p') || searchParams.has('pg')) {
      const key = searchParams.has('page') ? 'page' : (searchParams.has('p') ? 'p' : 'pg');
      searchParams.set(key, String(pageNum));
      return `${urlObj.origin}${urlObj.pathname}?${searchParams.toString()}`;
    }
    
    // Pattern 3: Default query fallback
    searchParams.set('page', String(pageNum));
    return `${urlObj.origin}${urlObj.pathname}?${searchParams.toString()}`;
  } catch (e) {
    return url;
  }
}

export async function prepareCrawlForSource(sourceId: string) {
  try {
    const source = await prisma.autoClonerSource.findUnique({
      where: { id: sourceId },
      include: { category: true }
    });

    if (!source) {
      throw new Error("Nguồn cloner không tồn tại");
    }

    let pageNum = 1;
    let allLinks: string[] = [];
    let validLinks: string[] = [];
    let shouldContinuePagination = true;
    const maxPages = 5; // Safety cap to avoid infinite loops

    while (shouldContinuePagination && pageNum <= maxPages) {
      const currentUrl = pageNum === 1 ? source.url : getNextPageUrl(source.url, pageNum);
      console.log(`[Auto Cloner] Fetching page ${pageNum}: ${currentUrl}`);
      
      const extractResult = await extractLinksFromCategory(currentUrl);
      if (!extractResult.success || !extractResult.links || extractResult.links.length === 0) {
        break;
      }
      const links = extractResult.links;
      let newLinksFoundOnThisPage = 0;
      let olderArticlesCount = 0;
      let duplicateArticlesCount = 0;

      const linksToCheck: string[] = [];
      for (const link of links) {
        if (allLinks.includes(link)) {
          continue;
        }
        allLinks.push(link);
        newLinksFoundOnThisPage++;

        // 1. Check duplicate
        const existingPost = await prisma.post.findFirst({
          where: {
            metadata: {
              contains: `"aiUrl":"${link}"`
            }
          }
        });

        if (existingPost) {
          duplicateArticlesCount++;
          continue;
        }
        linksToCheck.push(link);
      }

      // Check date limits: since the category is sorted from newest to oldest,
      // if the oldest (last) new link is within the limit, all newer links are guaranteed to be within the limit too.
      // This avoids up to 40 unnecessary HTTP requests.
      let allNewLinksWithinLimit = false;
      if (linksToCheck.length > 0) {
        const oldestNewLink = linksToCheck[linksToCheck.length - 1];
        allNewLinksWithinLimit = await isArticleWithinDateLimit(oldestNewLink, source.daysLimit);
      }

      let dateCheckResults = [];
      if (allNewLinksWithinLimit) {
        dateCheckResults = linksToCheck.map(link => ({ link, withinLimit: true }));
      } else {
        // Fallback to checking each one individually only if the oldest link is outside the limit
        dateCheckResults = await Promise.all(
          linksToCheck.map(async (link) => {
            const withinLimit = await isArticleWithinDateLimit(link, source.daysLimit);
            return { link, withinLimit };
          })
        );
      }

      for (const res of dateCheckResults) {
        if (!res.withinLimit) {
          olderArticlesCount++;
          continue;
        }
        validLinks.push(res.link);
      }
      console.log(`[Auto Cloner] Page ${pageNum}: new links=${newLinksFoundOnThisPage}, duplicate=${duplicateArticlesCount}, older=${olderArticlesCount}, valid=${validLinks.length}`);

      // Stop paginating if we hit duplicate articles (already crawled in previous runs)
      if (duplicateArticlesCount > 0) {
        shouldContinuePagination = false;
      }

      // Stop paginating if we hit articles older than limit
      if (olderArticlesCount > 0) {
        shouldContinuePagination = false;
      }

      // Stop paginating if no new links were found on this page
      if (newLinksFoundOnThisPage === 0) {
        shouldContinuePagination = false;
      }

      pageNum++;
    }

    return {
      success: true,
      url: source.url,
      categoryName: source.category.name,
      categorySlug: source.categorySlug,
      isForeign: source.isForeign,
      totalExtracted: allLinks.length,
      validLinks
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi chuẩn bị quét" };
  }
}

export async function crawlArticleLink(link: string, categorySlug: string, isForeign: boolean) {
  try {
    const crawlResult = await bulkCrawlAndSavePost(link, "PUBLISHED", categorySlug, isForeign);
    if (crawlResult.success) {
      return { success: true };
    } else {
      return { success: false, error: crawlResult.error || "Lỗi không xác định khi cào bài viết" };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi kết nối khi cào bài viết" };
  }
}

export async function updateSourceLastRun(sourceId: string) {
  try {
    await prisma.autoClonerSource.update({
      where: { id: sourceId },
      data: { lastRunAt: new Date() }
    });
    revalidatePath("/admin/auto-cloner");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi cập nhật mốc thời gian" };
  }
}

// Shared Global State for Background Jobs
export interface ClonerJob {
  id: string;
  sourceIds: string[];
  urlList: string[];
  totalSources: number;
  currentSourceIndex: number;
  totalExtracted: number;
  validCount: number;
  processedArticles: number;
  totalArticlesToCrawl: number;
  successCount: number;
  failedCount: number;
  currentArticleUrl: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  percentage?: number;
}

interface DbClonerState {
  activeJob: ClonerJob | null;
  queue: ClonerJob[];
  shouldAbort: boolean;
  lastUpdated: string;
}

async function getDbState(): Promise<DbClonerState> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "cloner_state" }
    });
    if (setting && setting.value) {
      return JSON.parse(setting.value);
    }
  } catch (error) {
    console.error("Error reading cloner state from DB:", error);
  }
  return {
    activeJob: null,
    queue: [],
    shouldAbort: false,
    lastUpdated: new Date().toISOString()
  };
}

async function saveDbState(state: DbClonerState) {
  try {
    await prisma.setting.upsert({
      where: { key: "cloner_state" },
      update: {
        value: JSON.stringify(state),
        updatedAt: new Date()
      },
      create: {
        key: "cloner_state",
        value: JSON.stringify(state),
        description: "Auto Cloner Active Job and Queue State"
      }
    });
  } catch (error) {
    console.error("Error saving cloner state to DB:", error);
  }
}

function calculatePercentage(job: ClonerJob): number {
  if (job.status === 'completed') return 100;
  if (job.status === 'failed') return 100;
  
  if (job.totalArticlesToCrawl === 0) {
    return Math.round((job.currentSourceIndex / (job.totalSources || 1)) * 20);
  } else {
    const crawlProgress = job.processedArticles / job.totalArticlesToCrawl;
    return Math.round(20 + crawlProgress * 80);
  }
}

async function updateJobProgress(job: ClonerJob) {
  const state = await getDbState();
  if (state.activeJob && state.activeJob.id === job.id) {
    state.activeJob = job;
    state.lastUpdated = new Date().toISOString();
    await saveDbState(state);
  }
}

export async function getClonerState() {
  const state = await getDbState();
  const now = new Date();
  
  if (state.activeJob && state.activeJob.status === 'running') {
    const lastUpdatedTime = new Date(state.lastUpdated);
    const secondsSinceLastUpdate = (now.getTime() - lastUpdatedTime.getTime()) / 1000;
    const isRunningInThisProcess = (globalThis as any).clonerJobRunningId === state.activeJob.id;
    
    if (secondsSinceLastUpdate > 20 && !isRunningInThisProcess) {
      console.log(`[Cloner] Active job ${state.activeJob.id} seems hung (last updated ${secondsSinceLastUpdate}s ago). Resuming...`);
      state.lastUpdated = now.toISOString();
      await saveDbState(state);
      
      runJobBackground(state.activeJob).catch(err => {
        console.error("[Cloner] Error resuming job:", err);
      });
    }
  } else if (!state.activeJob && state.queue.length > 0) {
    const nextJob = state.queue.shift();
    if (nextJob) {
      state.activeJob = nextJob;
      nextJob.status = 'running';
      state.lastUpdated = now.toISOString();
      await saveDbState(state);
      
      runJobBackground(nextJob).catch(err => {
        console.error("[Cloner] Error starting next job:", err);
      });
    }
  }
  
  if (state.activeJob) {
    state.activeJob.percentage = calculatePercentage(state.activeJob);
  }
  
  return {
    activeJob: state.activeJob,
    queue: state.queue
  };
}

async function runJobBackground(job: ClonerJob) {
  console.log(`[Background Cloner] Starting job ${job.id} for ${job.totalSources} sources`);
  (globalThis as any).clonerJobRunningId = job.id;
  
  try {
    const sources = await prisma.autoClonerSource.findMany({
      where: { id: { in: job.sourceIds } },
      include: { category: true }
    });

    job.urlList = sources.map(s => s.url);
    const prepResults = [];

    // Step 1: Prep phase
    for (let i = 0; i < sources.length; i++) {
      const currentState = await getDbState();
      if (currentState.shouldAbort || !currentState.activeJob || currentState.activeJob.id !== job.id) {
        console.warn("[Background Cloner] Job aborted during prep.");
        job.status = 'failed';
        await finishActiveJob(job);
        return;
      }
      
      const source = sources[i];
      job.currentSourceIndex = i + 1;
      job.currentArticleUrl = `Đang kết nối nguồn: ${source.url}`;
      await updateJobProgress(job);
      
      const prep = await prepareCrawlForSource(source.id);
      if (prep.success && prep.validLinks) {
        prepResults.push({
          id: source.id,
          url: source.url,
          validLinks: prep.validLinks,
          categorySlug: prep.categorySlug,
          isForeign: prep.isForeign
        });
        job.totalExtracted += prep.totalExtracted || 0;
        job.validCount += prep.validLinks.length;
      }
    }

    job.totalArticlesToCrawl = job.validCount;
    await updateJobProgress(job);

    if (job.totalArticlesToCrawl === 0) {
      console.log(`[Background Cloner] Job ${job.id} finished: no new articles found.`);
      job.status = 'completed';
      
      for (const source of sources) {
        await prisma.autoClonerSource.update({
          where: { id: source.id },
          data: { lastRunAt: new Date() }
        });
      }
      
      await finishActiveJob(job);
      return;
    }

    // Step 2: Crawl phase
    for (const prep of prepResults) {
      for (const link of prep.validLinks) {
        const currentState = await getDbState();
        if (currentState.shouldAbort || !currentState.activeJob || currentState.activeJob.id !== job.id) {
          console.warn("[Background Cloner] Job aborted during crawl.");
          job.status = 'failed';
          await finishActiveJob(job);
          return;
        }
        
        job.currentArticleUrl = link;
        await updateJobProgress(job);
        
        const res = await crawlArticleLink(link, prep.categorySlug, prep.isForeign);
        job.processedArticles++;
        
        if (res.success) {
          job.successCount++;
        } else {
          job.failedCount++;
        }
        await updateJobProgress(job);
      }

      await prisma.autoClonerSource.update({
        where: { id: prep.id },
        data: { lastRunAt: new Date() }
      });
    }

    job.status = 'completed';
    console.log(`[Background Cloner] Job ${job.id} completed. Success: ${job.successCount}, Failed: ${job.failedCount}`);
  } catch (error) {
    console.error(`[Background Cloner] Job ${job.id} failed:`, error);
    job.status = 'failed';
  } finally {
    const currentState = await getDbState();
    if (!currentState.shouldAbort) {
      await finishActiveJob(job);
    }
  }
}

async function finishActiveJob(job: ClonerJob) {
  if ((globalThis as any).clonerJobRunningId === job.id) {
    (globalThis as any).clonerJobRunningId = null;
  }
  
  const state = await getDbState();
  if (state.activeJob && state.activeJob.id === job.id) {
    state.activeJob = null;
    state.lastUpdated = new Date().toISOString();
    await saveDbState(state);
  }
  
  const updatedState = await getDbState();
  if (updatedState.queue.length > 0 && !updatedState.activeJob) {
    const nextJob = updatedState.queue.shift()!;
    updatedState.activeJob = nextJob;
    nextJob.status = 'running';
    updatedState.lastUpdated = new Date().toISOString();
    await saveDbState(updatedState);
    
    runJobBackground(nextJob).catch(err => {
      console.error("[Background Cloner] Error in running next job:", err);
    });
  }
}

export async function addClonerJob(sourceIds: string[]) {
  try {
    const state = await getDbState();
    
    if (state.queue.length >= 20) {
      return { success: false, message: "Hàng đợi đã đầy (Tối đa 20 yêu cầu). Vui lòng đợi!" };
    }
    
    if (state.activeJob && JSON.stringify(state.activeJob.sourceIds.sort()) === JSON.stringify(sourceIds.sort())) {
      return { success: true, message: "Yêu cầu trùng lặp với tiến trình đang chạy." };
    }
    
    const isDuplicateQueue = state.queue.some((q: ClonerJob) => 
      JSON.stringify(q.sourceIds.sort()) === JSON.stringify(sourceIds.sort())
    );
    if (isDuplicateQueue) {
      return { success: true, message: "Yêu cầu quét trùng lặp đã có trong hàng đợi." };
    }

    const newJob: ClonerJob = {
      id: Math.random().toString(36).substring(7),
      sourceIds,
      urlList: [],
      totalSources: sourceIds.length,
      currentSourceIndex: 0,
      totalExtracted: 0,
      validCount: 0,
      processedArticles: 0,
      totalArticlesToCrawl: 0,
      successCount: 0,
      failedCount: 0,
      currentArticleUrl: '',
      status: 'pending'
    };

    state.queue.push(newJob);
    state.lastUpdated = new Date().toISOString();
    await saveDbState(state);

    if (!state.activeJob) {
      const nextJob = state.queue.shift();
      if (nextJob) {
        state.activeJob = nextJob;
        nextJob.status = 'running';
        await saveDbState(state);
        runJobBackground(nextJob).catch(err => {
          console.error("[Background Cloner] Error starting next job:", err);
        });
      }
    }

    revalidatePath("/admin/auto-cloner");
    return { success: true, jobId: newJob.id };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi khi thêm tiến trình vào hàng đợi");
  }
}

export async function stopActiveClonerJob() {
  try {
    const state = await getDbState();
    state.shouldAbort = true;
    state.queue = [];
    
    if (state.activeJob) {
      state.activeJob.status = 'failed';
    }
    state.lastUpdated = new Date().toISOString();
    await saveDbState(state);
    
    setTimeout(async () => {
      try {
        const s = await getDbState();
        s.activeJob = null;
        s.shouldAbort = false;
        s.lastUpdated = new Date().toISOString();
        await saveDbState(s);
      } catch (err) {
        console.error(err);
      }
    }, 1500);

    revalidatePath("/admin/auto-cloner");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi khi dừng tiến trình");
  }
}

export async function getClonerHistory(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      isAiGenerated: true
    };

    if (params.search) {
      const isId = !isNaN(Number(params.search));
      if (isId) {
        where.id = Number(params.search);
      } else {
        where.title = {
          contains: params.search,
          mode: 'insensitive'
        };
      }
    }

    if (params.categoryId) {
      where.categories = {
        some: {
          id: params.categoryId
        }
      };
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        include: {
          categories: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const formattedPosts = posts.map(post => {
      let aiUrl = '';
      if (post.metadata) {
        try {
          const meta = JSON.parse(post.metadata);
          aiUrl = meta.aiUrl || '';
        } catch (e) {
          const match = post.metadata.match(/"aiUrl":"([^"]+)"/);
          if (match) {
            aiUrl = match[1];
          }
        }
      }
      return {
        id: post.id,
        title: post.title,
        aiUrl,
        categories: post.categories.map(c => c.name).join(', '),
        createdAt: post.createdAt
      };
    });

    return {
      success: true,
      posts: formattedPosts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Lỗi khi lấy lịch sử quét" };
  }
}
