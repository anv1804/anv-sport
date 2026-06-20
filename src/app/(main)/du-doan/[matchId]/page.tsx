import { Metadata } from 'next';
import MatchDetailClient from './MatchDetailClient';

export const metadata: Metadata = {
  title: 'Chi tiết nhận định | ANV Sport',
  description: 'AI dự đoán chi tiết trận đấu',
};

export default async function Page({ params }: { params: Promise<{ matchId: string }> }) {
  const resolvedParams = await params;
  return <MatchDetailClient matchId={resolvedParams.matchId} />;
}
