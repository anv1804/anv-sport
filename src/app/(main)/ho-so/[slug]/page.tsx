import { Metadata } from 'next';
import { PrismaClient } from '@prisma/client';
import PlayerDetailClient from '../../wiki/[slug]/PlayerDetailClient'; // Tạm thời dùng lại giao diện xịn sò đã làm ở cau-thu

const prisma = new PrismaClient();

export const metadata: Metadata = {
  title: 'Hồ Sơ | ANV Sport',
  description: 'Trung tâm dữ liệu thể thao lớn nhất',
};

export default async function HoSoPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Trong thực tế, hệ thống sẽ truy vấn CSDL dựa trên slug (ví dụ: nguyen-quang-hai-123)
  // const entity = await prisma.entity.findUnique({ where: { slug } });
  
  // Tuy nhiên, để tiếp tục hiển thị giao diện mẫu của Bukayo Saka (Mock Data)
  // Tôi truyền thẳng id "saka" vào component PlayerDetailClient.
  // Khi API thật hoạt động, Client này sẽ gọi fetch(`/api/entities/${entity.id}`)
  
  return <PlayerDetailClient playerId="saka" />;
}
