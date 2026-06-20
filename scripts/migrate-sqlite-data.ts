import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';

const db = new Database('./prisma/dev.db');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu lấy dữ liệu cấu hình từ SQLite cũ ---');
  
  // 1. Migrate Settings
  const settings = db.prepare('SELECT * FROM Setting').all() as any[];
  if (settings.length > 0) {
    console.log(`Đang đẩy ${settings.length} bản ghi Setting...`);
    for (const s of settings) {
      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value, description: s.description },
        create: { id: s.id, key: s.key, value: s.value, description: s.description }
      });
    }
  }

  // 2. Migrate Posts
  const posts = db.prepare('SELECT * FROM Post').all() as any[];
  if (posts.length > 0) {
    console.log(`Đang đẩy ${posts.length} bài viết (Post)...`);
    for (const p of posts) {
      await prisma.post.upsert({
        where: { id: p.id },
        update: { 
          title: p.title, excerpt: p.excerpt, content: p.content, imageUrl: p.imageUrl, 
          author: p.author, status: p.status, type: p.type, metadata: p.metadata,
          isAiGenerated: p.isAiGenerated === 1,
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) 
        },
        create: { 
          id: p.id, title: p.title, excerpt: p.excerpt, content: p.content, imageUrl: p.imageUrl, 
          author: p.author, status: p.status, type: p.type, metadata: p.metadata,
          isAiGenerated: p.isAiGenerated === 1,
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) 
        }
      });
    }
  }

  // 3. Migrate Pages
  const pages = db.prepare('SELECT * FROM Page').all() as any[];
  if (pages.length > 0) {
    console.log(`Đang đẩy ${pages.length} trang (Page)...`);
    for (const p of pages) {
      await prisma.page.upsert({
        where: { id: p.id },
        update: { 
          title: p.title, slug: p.slug, type: p.type, content: p.content, settings: p.settings, status: p.status,
          isDeletable: p.isDeletable === 1,
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) 
        },
        create: { 
          id: p.id, title: p.title, slug: p.slug, type: p.type, content: p.content, settings: p.settings, status: p.status,
          isDeletable: p.isDeletable === 1,
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) 
        }
      });
    }
  }

  console.log('--- Hoàn tất việc đẩy dữ liệu cũ lên Supabase! ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
