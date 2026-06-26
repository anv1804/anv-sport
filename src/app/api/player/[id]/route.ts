import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCachedPlayer, trackPlayerVisit } from '@/lib/content-cache';

function parseJson(raw: any) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ── Cache-Aside: Redis → DB (không dùng unstable_cache) ──────────────────
  const entity = await getCachedPlayer(id, () =>
    prisma.entity.findFirst({
      where: {
        OR: [
          { slug: id },
          { id },
          { slug: id.replace(/-[^-]+$/, '') },
        ]
      },
      include: { club: true },
    })
  );

  if (!entity) {
    return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
  }

  // Fire-and-forget: track visit vào hot:players ZSET
  trackPlayerVisit(entity.slug).catch(() => {});

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
      strengths: bi.strengths || stats.strengthsAndWeaknesses?.strengths || [],
      weaknesses: bi.weaknesses || stats.strengthsAndWeaknesses?.weaknesses || [],
      pitchPosition: bi.pitchPosition || position[0] || '',
    },
    performance: {
      overallRating: bi.overallRating || stats.averageRating || null,
      leagueRating: stats.averageRating || null,
      appearances: stats.totalMatches || null,
      monthlyForm: bi.monthlyForm && bi.monthlyForm.length > 0
        ? bi.monthlyForm
        : stats.monthlyForm && stats.monthlyForm.length > 0
        ? stats.monthlyForm
        : [
            { month: 'T1', rating: parseFloat(stats.averageRating || '6.5') - 0.2 },
            { month: 'T2', rating: parseFloat(stats.averageRating || '6.5') + 0.1 },
            { month: 'T3', rating: parseFloat(stats.averageRating || '6.5') },
            { month: 'T4', rating: parseFloat(stats.averageRating || '6.5') + 0.3 },
            { month: 'T5', rating: parseFloat(stats.averageRating || '6.5') - 0.1 },
            { month: 'T6', rating: parseFloat(stats.averageRating || '6.5') + 0.2 },
          ],
    },
    attributes: stats.attributes
      ? Object.entries(stats.attributes).map(([key, val]) => ({
          subject: key,
          A: val,
          fullMark: 100,
        }))
      : [],
    averageRating: stats.averageRating || null,
    ratingHistory: bi.ratingHistory
      ? bi.ratingHistory
      : stats.ratingHistory
      ? stats.ratingHistory
      : {
          average: stats.averageRating || '6.5',
          history: [
            { date: 'Th1', rating: parseFloat(stats.averageRating || '6.5') - 0.3 },
            { date: 'Th2', rating: parseFloat(stats.averageRating || '6.5') },
            { date: 'Th3', rating: parseFloat(stats.averageRating || '6.5') + 0.2 },
            { date: 'Th4', rating: parseFloat(stats.averageRating || '6.5') - 0.1 },
            { date: 'Th5', rating: parseFloat(stats.averageRating || '6.5') + 0.1 },
          ]
        },
    seasonStats: bi.seasonStats || null,
    achievements,
    matches: stats.matches && stats.matches.length > 0
      ? stats.matches
      : [
          {
            id: 'm1',
            tournament: 'Premier League',
            date: 'Vòng 38',
            status: 'FT',
            team1: { name: entity.club?.name || 'Tottenham Hotspur', logo: entity.club?.logo || '' },
            team2: { name: 'Chelsea', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png' },
            score1: 2,
            score2: 1,
            playerRating: stats.averageRating || '6.8'
          },
          {
            id: 'm2',
            tournament: 'FA Cup',
            date: 'Vòng 5',
            status: 'FT',
            team1: { name: 'Manchester United', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/1200px-Manchester_United_FC_crest.svg.png' },
            team2: { name: entity.club?.name || 'Tottenham Hotspur', logo: entity.club?.logo || '' },
            score1: 1,
            score2: 3,
            playerRating: (parseFloat(stats.averageRating || '6.8') + 0.4).toFixed(1)
          }
        ],
  };

  return NextResponse.json({ success: true, data });
}

