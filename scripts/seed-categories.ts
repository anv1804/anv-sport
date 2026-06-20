import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    name: 'Bóng đá',
    slug: 'bong-da',
    description: 'Tin tức bóng đá trong nước và quốc tế',
    sub: [
      { name: 'Bóng đá Việt Nam', slug: 'bong-da-viet-nam' },
      { name: 'Bóng đá Anh', slug: 'bong-da-anh' },
      { name: 'Bóng đá Tây Ban Nha', slug: 'bong-da-tay-ban-nha' },
      { name: 'Champions League', slug: 'champions-league' },
      { name: 'World Cup', slug: 'world-cup' },
    ]
  },
  {
    name: 'Thể thao tổng hợp',
    slug: 'the-thao-tong-hop',
    description: 'Tin tức các môn thể thao khác',
    sub: [
      { name: 'Quần vợt', slug: 'quan-vot' },
      { name: 'Đua xe F1', slug: 'dua-xe-f1' },
      { name: 'Golf', slug: 'golf' },
      { name: 'Võ thuật', slug: 'vo-thuat' },
    ]
  },
  {
    name: 'eSports',
    slug: 'esports',
    description: 'Thể thao điện tử',
    sub: [
      { name: 'Liên Minh Huyền Thoại', slug: 'lien-minh-huyen-thoai' },
      { name: 'CS2', slug: 'cs2' },
      { name: 'Valorant', slug: 'valorant' },
    ]
  },
  {
    name: 'Hậu trường',
    slug: 'hau-truong',
    description: 'Câu chuyện bên lề sân cỏ',
    sub: []
  },
  {
    name: 'Video',
    slug: 'video',
    description: 'Video thể thao đặc sắc',
    sub: []
  }
];

async function main() {
  console.log('Bắt đầu thêm dữ liệu mẫu cho Category...');

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    console.log(`Đã tạo/cập nhật danh mục cha: ${parent.name}`);

    for (const sub of cat.sub) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, parentId: parent.id },
        create: { name: sub.name, slug: sub.slug, parentId: parent.id },
      });
      console.log(`  -> Đã tạo/cập nhật danh mục con: ${sub.name}`);
    }
  }

  console.log('Hoàn thành!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
