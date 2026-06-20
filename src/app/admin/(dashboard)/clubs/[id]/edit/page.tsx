import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ClubFormClient } from '../../ClubFormClient';

export default async function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id } });
  if (!club) {
    notFound();
  }

  const sports = await prisma.sport.findMany({ orderBy: { name: 'asc' } });
  const countries = await prisma.country.findMany({ orderBy: { name: 'asc' } });
  const leagues = await prisma.league.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ClubFormClient club={club} sports={sports} countries={countries} leagues={leagues} />
    </div>
  );
}
