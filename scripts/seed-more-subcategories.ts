import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const newSubcategories = {
  'golf': [
    { name: 'PGA Tour', slug: 'pga-tour' },
    { name: 'LIV Golf', slug: 'liv-golf' },
    { name: 'Golf Việt Nam', slug: 'golf-viet-nam' }
  ],
  'quan-vot': [
    { name: 'ATP', slug: 'atp' },
    { name: 'WTA', slug: 'wta' },
    { name: 'Grand Slam', slug: 'grand-slam' },
    { name: 'Quần vợt Việt Nam', slug: 'quan-vot-viet-nam' }
  ],
  'vo-thuat': [
    { name: 'UFC', slug: 'ufc' },
    { name: 'Boxing', slug: 'boxing' },
    { name: 'ONE Championship', slug: 'one-championship' },
    { name: 'Võ thuật Việt Nam', slug: 'vo-thuat-viet-nam' }
  ],
  'dua-xe-f1': [
    { name: 'Tin tức F1', slug: 'tin-tuc-f1' },
    { name: 'Chặng đua', slug: 'chang-dua-f1' }
  ],
  'hau-truong': [
    { name: 'Ngôi sao', slug: 'ngoi-sao-hau-truong' },
    { name: 'Bóng hồng', slug: 'bong-hong' },
    { name: 'Góc khuất', slug: 'goc-khuat' }
  ],
  'video': [
    { name: 'Bàn thắng đẹp', slug: 'ban-thang-dep' },
    { name: 'Highlight', slug: 'highlight' }
  ]
};

async function run() {
  console.log('Bắt đầu thêm các danh mục con mới...');
  
  for (const [parentSlug, subs] of Object.entries(newSubcategories)) {
    const parent = await prisma.category.findUnique({ where: { slug: parentSlug } });
    if (!parent) {
      console.log(`Không tìm thấy danh mục cha có slug: ${parentSlug}`);
      continue;
    }

    for (const sub of subs) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id },
        create: { name: sub.name, slug: sub.slug, parentId: parent.id },
      });
      console.log(`  -> Đã thêm/cập nhật mục con "${sub.name}" cho "${parent.name}"`);
    }
  }
  
  console.log('Hoàn thành!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
