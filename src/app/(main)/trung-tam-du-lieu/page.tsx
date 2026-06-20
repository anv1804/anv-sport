import prisma from '@/lib/prisma';
import { DataCenterClient } from './DataCenterClient';

export const metadata = {
  title: 'Trung Tâm Dữ Liệu | ANV Sport',
  description: 'Kho tàng thông tin chi tiết về các siêu sao sân cỏ và những câu lạc bộ hàng đầu thế giới.'
};

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function DataCenterPage() {
  const [players, clubs] = await Promise.all([
    prisma.entity.findMany({
      where: { type: 'FOOTBALL_PLAYER' },
      include: { club: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.club.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  return <DataCenterClient players={players} clubs={clubs} />;
}
