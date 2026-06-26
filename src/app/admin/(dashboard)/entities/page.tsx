import prisma from '@/lib/prisma';
import Link from 'next/link';
import { WikiCrawlerWrapper } from '@/components/admin/WikiCrawlerWrapper';
import { Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/shared/AdminPageHeader';
import EntitiesClient from './EntitiesClient';

export default async function EntitiesAdminPage() {
  const entities = await prisma.entity.findMany({
    include: { club: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });

  const clubs = await prisma.club.findMany({
    select: { id: true, name: true, countryId: true, leagueId: true },
    orderBy: { name: 'asc' }
  });

  const countries = await prisma.country.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const leagues = await prisma.league.findMany({
    select: { id: true, name: true, countryId: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Quản lý Cầu thủ / VĐV"
        description="Danh sách nhân vật thể thao trong Trung Tâm Dữ Liệu."
        actions={<>
          <WikiCrawlerWrapper clubs={clubs} countries={countries} leagues={leagues} />
          <Link href="/admin/entities/new" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center text-[13px]">
            <Plus className="w-4 h-4 mr-1.5" /> Thêm Mới VĐV
          </Link>
        </>}
      />

      <EntitiesClient initialEntities={entities} initialClubs={clubs} />
    </div>
  );
}
