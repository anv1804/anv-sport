import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  await prisma.category.updateMany({
    where: { 
      name: { 
        in: ['Golf', 'Quần vợt', 'Võ thuật', 'Đua xe F1'] 
      } 
    },
    data: { parentId: null }
  });
  console.log("Đã cập nhật các chuyên mục thành mục chính!");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
