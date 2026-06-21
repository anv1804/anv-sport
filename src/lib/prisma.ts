import { PrismaClient } from '@prisma/client';
import { initClonerScheduler } from "./clonerScheduler";
import { initSupercomputerScheduler } from "./supercomputerScheduler";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Limit connection pool to prevent EMAXCONN in dev/serverless environments
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Initialize Background Auto Cloner Scheduler & Supercomputer
try {
  initClonerScheduler();
  initSupercomputerScheduler();
} catch (error) {
  console.error("[Scheduler Init Error]:", error);
}

// Background Migration to enrich existing posts with SEO Score and Word Count
async function migrateExistingPosts() {
  if ((globalThis as any).postsMigrationStarted) return;
  (globalThis as any).postsMigrationStarted = true;
  
  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { metadata: { not: { contains: "seoScore" } } },
          { metadata: null }
        ]
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        metadata: true
      }
    });
    
    if (posts.length > 0) {
      console.log(`[Migration] Found ${posts.length} posts to enrich with SEO and word count`);
      const { evaluateSeo } = require("./seo/evaluator");
      
      for (const post of posts) {
        let meta: any = {};
        if (post.metadata) {
          try {
            meta = JSON.parse(post.metadata);
          } catch (e) {}
        }
        
        const seoResult = evaluateSeo({
          title: post.title,
          excerpt: post.excerpt || "",
          content: post.content || "",
          keywords: meta.seoKeywords || "",
          seoTitle: meta.seoTitle,
          seoDescription: meta.seoDescription,
          seoUrl: meta.seoUrl
        });
        
        const wordCount = post.content ? post.content.replace(/<[^>]*>?/gm, " ").trim().split(/\s+/).filter(w => w.length > 0).length : 0;
        
        meta.seoScore = seoResult.score;
        meta.wordCount = wordCount;
        
        await prisma.post.update({
          where: { id: post.id },
          data: { metadata: JSON.stringify(meta) }
        });
        
        // Throttling: yield control back to event loop to prevent starvation
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      console.log(`[Migration] Enriched all ${posts.length} posts successfully.`);
    }
  } catch (error) {
    console.error("[Migration] Error migrating posts:", error);
  }
}

// Trigger migration in the background
migrateExistingPosts().catch(err => {
  console.error("[Migration Trigger Error]:", err);
});

export default prisma;
