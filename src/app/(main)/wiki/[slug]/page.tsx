import { Metadata } from 'next';
import PlayerDetailClient from './PlayerDetailClient';

export const metadata: Metadata = {
  title: 'Trung tâm Phân tích Cầu thủ | ANV Sport',
  description: 'Dữ liệu và thống kê chi tiết chuyên sâu của cầu thủ',
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Pass the full slug — the API will match by slug directly
  return <PlayerDetailClient playerId={slug} />;
}
