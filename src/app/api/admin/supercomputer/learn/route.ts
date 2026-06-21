import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Fetch system status from settings
    const statsSetting = await prisma.setting.findUnique({
      where: { key: 'SUPERCOMPUTER_STATS' }
    });
    const logsSetting = await prisma.setting.findUnique({
      where: { key: 'SUPERCOMPUTER_LOGS' }
    });

    const stats = statsSetting ? JSON.parse(statsSetting.value) : {
      status: 'Idle',
      lastTrainedAt: null,
      totalPredicted: 0,
      totalKnowledgeCrawled: 0
    };

    const logs = logsSetting ? JSON.parse(logsSetting.value) : [];

    // 2. Fetch ongoing tournaments & upcoming matches to show on UI
    // We can query our database or call the /api/fixtures endpoint internally
    // Let's call the internal matches to get active leagues & upcoming counts
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const fixturesUrl = `${protocol}://${host}/api/fixtures`;
    
    let activeLeagues: string[] = [];
    let upcomingMatchesCount = 0;
    
    try {
      const fixturesRes = await fetch(fixturesUrl, { next: { revalidate: 0 } });
      if (fixturesRes.ok) {
        const fixturesJson = await fixturesRes.json();
        if (fixturesJson.success && Array.isArray(fixturesJson.data)) {
          const leaguesSet = new Set<string>();
          fixturesJson.data.forEach((match: any) => {
            if (match.category) {
              leaguesSet.add(match.category);
            }
            if (match.status === 'Chưa đá' || match.status === 'Upcoming') {
              upcomingMatchesCount++;
            }
          });
          activeLeagues = Array.from(leaguesSet);
        }
      }
    } catch (err) {
      console.error("[Supercomputer] Error fetching active tournaments:", err);
      // Fallback leagues
      activeLeagues = ['English Premier League', 'La Liga', 'UEFA Champions League', 'V-League 1', 'FIFA World Cup 2026'];
    }

    return NextResponse.json({
      success: true,
      stats,
      logs,
      activeLeagues,
      upcomingMatchesCount
    });
  } catch (error: any) {
    console.error("[Supercomputer GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { executeSupercomputerLearn } = require('@/lib/supercomputerScheduler');
    
    // Trigger in background sync or await
    await executeSupercomputerLearn();

    const statsSetting = await prisma.setting.findUnique({
      where: { key: 'SUPERCOMPUTER_STATS' }
    });
    const logsSetting = await prisma.setting.findUnique({
      where: { key: 'SUPERCOMPUTER_LOGS' }
    });

    const stats = statsSetting ? JSON.parse(statsSetting.value) : {
      status: 'Idle',
      lastTrainedAt: null,
      totalPredicted: 0,
      totalKnowledgeCrawled: 0
    };
    const logs = logsSetting ? JSON.parse(logsSetting.value) : [];

    return NextResponse.json({
      success: true,
      stats,
      logs
    });
  } catch (error: any) {
    console.error("[Supercomputer POST] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
