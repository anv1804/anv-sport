import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function parseJson(raw: any) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try to find by slug first, then by ID
  const entity = await prisma.entity.findFirst({
    where: {
      OR: [
        { slug: id },
        { id },
        // support URL pattern like "bukayo-saka" matching slug "bukayo-saka"
        { slug: id.replace(/-[^-]+$/, '') },
      ]
    },
    include: { club: true },
  });

  if (!entity) {
    return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
  }

  const bi = parseJson(entity.basicInfo) || {};
  const stats = parseJson(entity.stats) || {};
  const achievements = parseJson(entity.achievements) || [];

  const nationality = Array.isArray(bi.nationality) ? bi.nationality[0] : bi.nationality;
  const position = Array.isArray(bi.position) ? bi.position : [bi.position].filter(Boolean);

  const data = {
    id: entity.slug,
    name: entity.name,
    image: entity.avatar || '',
    team: {
      name: entity.club?.name || '',
      logo: entity.club?.logo || '',
      contractUntil: bi.contractUntil ? new Date(bi.contractUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    },
    personalInfo: {
      nationality: { name: nationality || '', flagCode: nationality === 'England' ? 'gb-eng' : 'unknown' },
      birthDate: bi.birthDate ? new Date(bi.birthDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      age: bi.birthDate ? Math.floor((Date.now() - new Date(bi.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)) : null,
      height: bi.height || null,
      weight: bi.weight || null,
      preferredFoot: bi.preferredFoot || '',
      position: position[0] || '',
      positions: position,
      shirtNumber: bi.shirtNumber || null,
      playerValue: bi.playerValue || '',
      placeOfBirth: bi.placeOfBirth || '',
      nicknames: bi.nicknames || [],
      internationalCaps: bi.internationalCaps || null,
      internationalGoals: bi.internationalGoals || null,
      careerGoals: bi.careerGoals || null,
      careerApps: bi.careerApps || null,
    },
    traits: {
      strengths: bi.strengths || [],
      weaknesses: bi.weaknesses || [],
      pitchPosition: bi.pitchPosition || position[0] || '',
    },
    performance: {
      overallRating: bi.overallRating || null,
      leagueRating: null,
      appearances: null,
      monthlyForm: bi.monthlyForm || [],
    },
    attributes: stats.attributes
      ? Object.entries(stats.attributes).map(([key, val]) => ({
          subject: key,
          A: val,
          fullMark: 100,
        }))
      : [],
    averageRating: stats.averageRating || null,
    ratingHistory: bi.ratingHistory || null,
    seasonStats: bi.seasonStats || null,
    achievements,
    matches: [],
  };

  return NextResponse.json({ success: true, data });
}
