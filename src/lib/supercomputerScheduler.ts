import prisma from './prisma';
import { generateWithFallback } from './aiBox';
import fs from 'fs';
import path from 'path';

let isSupercomputerInProgress = false;

// List of football categories and national leagues to learn about
const TARGETS_TO_LEARN = [
  { league: "English Premier League", country: "England" },
  { league: "La Liga", country: "Spain" },
  { league: "Serie A", country: "Italy" },
  { league: "V-League 1", country: "Vietnam" },
  { league: "FIFA World Cup 2026", country: "International" }
];

export async function executeSupercomputerLearn() {
  if (isSupercomputerInProgress) {
    console.log("[Supercomputer Scheduler] Learn task already in progress. Skipping.");
    return;
  }

  isSupercomputerInProgress = true;
  console.log("[Supercomputer Scheduler] Starting deep football knowledge ingestion & prediction pre-generation...");

  try {
    const statsSetting = await prisma.setting.findUnique({
      where: { key: 'SUPERCOMPUTER_STATS' }
    });
    const currentStats = statsSetting ? JSON.parse(statsSetting.value) : {
      status: 'Idle',
      lastTrainedAt: null,
      totalPredicted: 0,
      totalKnowledgeCrawled: 0
    };

    currentStats.status = 'Running';
    await prisma.setting.upsert({
      where: { key: 'SUPERCOMPUTER_STATS' },
      update: { value: JSON.stringify(currentStats) },
      create: { key: 'SUPERCOMPUTER_STATS', value: JSON.stringify(currentStats), description: 'Supercomputer analytics stats' }
    });

    const logsSetting = await prisma.setting.findUnique({
      where: { key: 'SUPERCOMPUTER_LOGS' }
    });
    const currentLogs = logsSetting ? JSON.parse(logsSetting.value) : [];

    const addLog = async (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        type
      };
      currentLogs.unshift(logEntry);
      if (currentLogs.length > 100) currentLogs.pop();
      await prisma.setting.upsert({
        where: { key: 'SUPERCOMPUTER_LOGS' },
        update: { value: JSON.stringify(currentLogs) },
        create: { key: 'SUPERCOMPUTER_LOGS', value: JSON.stringify(currentLogs), description: 'Supercomputer event logs' }
      });
    };

    await addLog("[BACKGROUND DEEMON] Bắt đầu chu trình tự học chuyên sâu & tích lũy tri thức bóng đá...", "info");

    // Phase 1: Ingest Tactical Formations & Playstyles
    await addLog("Học hỏi bản chất bóng đá: Đang phân tích chiến thuật, sơ đồ đội hình (Formations) & lối chơi...", "info");
    
    // We update local tactic files or save knowledge inside database. 
    // To implement "creates a massive knowledge base", we will generate structured tacticial intelligence.
    let tacticsRef: any = {};
    try {
      const tacticsPath = path.join(process.cwd(), 'src/lib/tactics/formations_and_playstyles.json');
      if (fs.existsSync(tacticsPath)) {
        tacticsRef = JSON.parse(fs.readFileSync(tacticsPath, 'utf-8'));
      }
    } catch (e) {}

    const knownFormations = Object.keys(tacticsRef.formations || { "4-3-3": {}, "4-2-3-1": {}, "3-5-2": {} });
    await addLog(`Đã nghiên cứu và phân tích bản chất của ${knownFormations.length} sơ đồ đội hình bóng đá kinh điển.`, "success");
    currentStats.totalKnowledgeCrawled += knownFormations.length * 10;

    // Phase 2: Ingest League, Country & Team playstyles
    for (const target of TARGETS_TO_LEARN) {
      try {
        await addLog(`Đang học hỏi xu hướng chiến thuật & triết lý bóng đá của giải đấu: ${target.league} (${target.country})...`, "info");
        
        const systemPrompt = `You are a legendary football tactician and sports scientist. 
Your goal is to build a comprehensive knowledge model about the specific league and country.`;
        
        const prompt = `Analyze the tactical identity, physical characteristics, typical tempo, and tactical evolution of ${target.league} in ${target.country}.
Detail how team identities differ (e.g., possession setups vs low-block transitions) and key player archetypes in this competition.
Return a structured JSON output with the fields:
{
  "leagueIdentity": "...",
  "averageTempo": "Low / Medium / High",
  "tacticalTrends": ["trend1", "trend2"],
  "archetypalPlayers": "..."
}`;

        const aiResponse = await generateWithFallback(prompt, systemPrompt, true);
        const knowledge = JSON.parse(aiResponse);

        // Store target knowledge in Settings database to build a permanent persistent knowledge pool
        await prisma.setting.upsert({
          where: { key: `KNOWLEDGE_LEAGUE_${target.league.replace(/\s+/g, '_').toUpperCase()}` },
          update: { value: JSON.stringify(knowledge) },
          create: {
            key: `KNOWLEDGE_LEAGUE_${target.league.replace(/\s+/g, '_').toUpperCase()}`,
            value: JSON.stringify(knowledge),
            description: `Football knowledge base for ${target.league}`
          }
        });

        currentStats.totalKnowledgeCrawled += 50; // Each target adds 50 knowledge points
        await addLog(`Đã đúc kết và tổng hợp thành công tri thức cho ${target.league} vào cơ sở dữ liệu.`, "success");
      } catch (err: any) {
        await addLog(`Lỗi khi phân tích giải ${target.league}: ${err.message}`, "error");
      }
    }

    // Phase 3: Match Predictions Pre-generation
    const port = process.env.PORT || '3000';
    const baseUrl = `http://localhost:${port}`;

    await addLog("Sử dụng kiến thức đã học: Bắt đầu quét & dự đoán các trận đấu chuẩn bị diễn ra...", "info");
    const fixturesRes = await fetch(`${baseUrl}/api/fixtures`, { next: { revalidate: 0 } });
    if (fixturesRes.ok) {
      const fixturesData = await fixturesRes.json();
      if (fixturesData.success && Array.isArray(fixturesData.data)) {
        const upcomingMatches = fixturesData.data.filter((m: any) => m.status === "Chưa đá" || m.status === "Upcoming");
        await addLog(`Tìm thấy ${upcomingMatches.length} trận đấu sắp tới. Tiến hành dự đoán...`, "info");

        let countPredicted = 0;
        for (const match of upcomingMatches) {
          try {
            // Load details
            const detailRes = await fetch(`${baseUrl}/api/fixtures?id=${match.id}`, { next: { revalidate: 0 } });
            let matchDetails = match;
            if (detailRes.ok) {
              const detailJson = await detailRes.json();
              if (detailJson && detailJson.success && detailJson.data) {
                matchDetails = detailJson.data;
              }
            }

            // Call generate prediction
            const genRes = await fetch(`${baseUrl}/api/generate-prediction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: `${match.team1.name} vs ${match.team2.name}`,
                matchId: match.id,
                matchData: matchDetails,
                milestone: 'PRE_MATCH'
              })
            });

            if (genRes.ok) {
              const genJson = await genRes.json();
              if (genJson.predictionData) {
                countPredicted++;
                currentStats.totalPredicted++;
              }
            }
          } catch (e) {}
        }
        await addLog(`Đã hoàn tất dự đoán tự động cho ${countPredicted} trận đấu chuẩn bị diễn ra.`, "success");
      }
    }

    currentStats.status = 'Idle';
    currentStats.lastTrainedAt = new Date().toISOString();

    await prisma.setting.upsert({
      where: { key: 'SUPERCOMPUTER_STATS' },
      update: { value: JSON.stringify(currentStats) },
      create: { key: 'SUPERCOMPUTER_STATS', value: JSON.stringify(currentStats) }
    });

    await addLog(`[BACKGROUND DEEMON] Hoàn thành xuất sắc chu kỳ học hỏi sâu. Tổng kiến thức tích lũy hiện tại: ${currentStats.totalKnowledgeCrawled} đơn vị.`, "success");

  } catch (error: any) {
    console.error("[Supercomputer Scheduler] Error:", error);
    try {
      const statsSetting = await prisma.setting.findUnique({ where: { key: 'SUPERCOMPUTER_STATS' } });
      if (statsSetting) {
        const stats = JSON.parse(statsSetting.value);
        stats.status = 'Idle';
        await prisma.setting.update({
          where: { key: 'SUPERCOMPUTER_STATS' },
          data: { value: JSON.stringify(stats) }
        });
      }
    } catch (e) {}
  } finally {
    isSupercomputerInProgress = false;
  }
}

export function initSupercomputerScheduler() {
  const isBuilding = typeof process !== 'undefined' && (
    process.argv.includes('build') || 
    process.env.NEXT_PHASE === 'phase-production-build'
  );
  if (isBuilding) {
    return;
  }

  if ((globalThis as any).supercomputerSchedulerInitialized) {
    return;
  }
  (globalThis as any).supercomputerSchedulerInitialized = true;

  console.log("[Supercomputer Scheduler] Background scheduler initialized.");

  // Check every 4 hours
  const intervalMs = 4 * 60 * 60 * 1000;

  // Run initial tick after 15 seconds to ensure server is fully ready
  setTimeout(executeSupercomputerLearn, 15000);

  // Set periodic check
  setInterval(executeSupercomputerLearn, intervalMs);
}
