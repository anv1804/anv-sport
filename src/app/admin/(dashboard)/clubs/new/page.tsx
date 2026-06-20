import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ClubFormClient } from '../ClubFormClient';
import prisma from '@/lib/prisma';

export const metadata = {
  title: 'Thêm Mới Câu Lạc Bộ | CMS',
};

export default async function NewClubPage() {
  const sports = await prisma.sport.findMany({ orderBy: { name: 'asc' } });
  const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
  const leagues = await prisma.league.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ClubFormClient sports={sports} countries={countries} leagues={leagues} />
    </div>
  );
}
