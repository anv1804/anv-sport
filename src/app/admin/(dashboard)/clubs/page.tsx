import prisma from '@/lib/prisma';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import ClubsClient from './ClubsClient';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BatchCrawlButton } from './BatchCrawlButton';

export default async function ClubsAdminPage() {
  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entities: true } } }
  });

  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' }
  });

  const leagues = await prisma.league.findMany({
    orderBy: { name: 'asc' }
  });

  const sports = await prisma.sport.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Quản lý Câu lạc bộ"
        description="Quản lý danh sách các đội bóng, CLB thể thao trong hệ thống."
        actions={
          <div className="flex items-center gap-3">
            <BatchCrawlButton countries={countries} leagues={leagues} />
            <Link href="/admin/clubs/new" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center text-[13px]">
              <Plus className="w-4 h-4 mr-1.5" /> Thêm Mới
            </Link>
          </div>
        }
      />
      
      <ClubsClient initialClubs={clubs} initialCountries={countries} initialLeagues={leagues} initialSports={sports} />
    </div>
  );
}
