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
          continue;
        }

        // 2. Check date limit
        const withinLimit = await isArticleWithinDateLimit(link, source.daysLimit);
        if (!withinLimit) {
          olderArticlesCount++;
          continue;
        }

        validLinks.push(link);
      }

      console.log(`[Auto Cloner] Page ${pageNum}: new links=${newLinksFoundOnThisPage}, older=${olderArticlesCount}, valid=${validLinks.length}`);

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
}

if (!(globalThis as any).clonerState) {
  (globalThis as any).clonerState = {
    activeJob: null as ClonerJob | null,
    queue: [] as ClonerJob[],
    shouldAbort: false
  };
}

export async function getClonerState() {
  const state = (globalThis as any).clonerState;
  return {
    activeJob: state.activeJob,
    queue: state.queue
  };
}

async function runJobBackground(job: ClonerJob) {
  console.log(`[Background Cloner] Starting job ${job.id} for ${job.totalSources} sources`);
  
  try {
    const sources = await prisma.autoClonerSource.findMany({
      where: { id: { in: job.sourceIds } },
      include: { category: true }
    });

    job.urlList = sources.map(s => s.url);
    const prepResults = [];

    // Step 1: Prep phase
    for (let i = 0; i < sources.length; i++) {
      if ((globalThis as any).clonerState.shouldAbort) {
        console.warn("[Background Cloner] Job aborted during prep.");
        job.status = 'failed';
        finishActiveJob();
        return;
      }
      
      const source = sources[i];
      job.currentSourceIndex = i + 1;
      job.currentArticleUrl = `Đang kết nối nguồn: ${source.url}`;
      
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

    if (job.totalArticlesToCrawl === 0) {
      console.log(`[Background Cloner] Job ${job.id} finished: no new articles found.`);
      job.status = 'completed';
      
      // Update last run time
      for (const source of sources) {
        await prisma.autoClonerSource.update({
          where: { id: source.id },
          data: { lastRunAt: new Date() }
        });
      }
      
      finishActiveJob();
      return;
    }

    // Step 2: Crawl phase
    for (const prep of prepResults) {
      for (const link of prep.validLinks) {
        if ((globalThis as any).clonerState.shouldAbort) {
          console.warn("[Background Cloner] Job aborted during crawl.");
          job.status = 'failed';
          finishActiveJob();
          return;
        }
        
        job.currentArticleUrl = link;
        
        const res = await crawlArticleLink(link, prep.categorySlug, prep.isForeign);
        job.processedArticles++;
        
        if (res.success) {
          job.successCount++;
        } else {
          job.failedCount++;
        }
      }

      // Update last run time
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
    if (!(globalThis as any).clonerState.shouldAbort) {
      finishActiveJob();
    }
  }
}

function finishActiveJob() {
  const state = (globalThis as any).clonerState;
  
  // Explicitly clear references inside the job to help Garbage Collector (GC)
  if (state.activeJob) {
    state.activeJob.sourceIds = [];
    state.activeJob.urlList = [];
    state.activeJob.currentArticleUrl = '';
  }
  
  state.activeJob = null;
  
  // Trigger next job in queue after a short delay
  setTimeout(() => {
    processNextJob();
  }, 1000);
}

function processNextJob() {
  const state = (globalThis as any).clonerState;
  if (state.activeJob !== null) {
    return;
  }
  if (state.queue.length === 0) {
    return;
  }

  const nextJob = state.queue.shift();
  if (nextJob) {
    state.activeJob = nextJob;
    nextJob.status = 'running';
    runJobBackground(nextJob).catch(err => {
      console.error("[Background Cloner] Error in running next job:", err);
    });
  }
}

export async function addClonerJob(sourceIds: string[]) {
  try {
    const state = (globalThis as any).clonerState;
    
    // Safety cap to prevent memory bloat/DOS spamming
    if (state.queue.length >= 20) {
      return { success: false, message: "Hàng đợi đã đầy (Tối đa 20 yêu cầu). Vui lòng đợi!" };
    }
    
    // Check if the exact same source list is already in active or queue to avoid duplicates
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
    processNextJob();

    revalidatePath("/admin/auto-cloner");
    return { success: true, jobId: newJob.id };
  } catch (error: any) {
    throw new Error(error.message || "Lỗi khi thêm tiến trình vào hàng đợi");
  }
}

export async function stopActiveClonerJob() {
  try {
    const state = (globalThis as any).clonerState;
    state.shouldAbort = true;
    state.queue = [];
    
    if (state.activeJob) {
      state.activeJob.status = 'failed';
    }
    
    setTimeout(() => {
      state.activeJob = null;
      state.shouldAbort = false;
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
