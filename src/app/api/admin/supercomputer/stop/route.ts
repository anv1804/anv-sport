import { NextResponse } from 'next/server';
import { requestSupercomputerStop } from '@/lib/supercomputerScheduler';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Signal any running loop to stop (no-op if not running)
    requestSupercomputerStop();

    // Always reset DB status to Idle — handles stale 'Running' after server restart
    const statsSetting = await prisma.setting.findUnique({
      where: { key: 'SUPERCOMPUTER_STATS' }
    });
    if (statsSetting) {
      const stats = JSON.parse(statsSetting.value);
      stats.status = 'Idle';
      await prisma.setting.update({
        where: { key: 'SUPERCOMPUTER_STATS' },
        data: { value: JSON.stringify(stats) }
      });
    }

    return NextResponse.json({ success: true, message: 'Đã dừng tiến trình Siêu Máy Tính.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
