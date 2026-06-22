'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createEntity(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const type = formData.get('type') as string;
  const avatar = formData.get('avatar') as string;
  const clubId = formData.get('clubId') as string;
  // Extract basicInfo individual fields
  const basicInfo_fullName = formData.get('basicInfo_fullName') as string;
  const basicInfo_birthDate = formData.get('basicInfo_birthDate') as string;
  const basicInfo_nationality_raw = formData.get('basicInfo_nationality') as string;
  const basicInfo_height = formData.get('basicInfo_height') as string;
  const basicInfo_position_raw = formData.get('basicInfo_position') as string;
  const basicInfo_preferredFoot = formData.get('basicInfo_preferredFoot') as string;
  const basicInfo_shirtNumber = formData.get('basicInfo_shirtNumber') as string;
  const basicInfo_playerValue = formData.get('basicInfo_playerValue') as string;
  const basicInfo_contractUntil = formData.get('basicInfo_contractUntil') as string;

  const basicInfoStr = formData.get('basicInfo') as string; // Optional raw JSON fallback
  const achievements = formData.get('achievements') as string;
  const stats = formData.get('stats') as string;

  if (!name || !slug) {
    throw new Error('Name and slug are required');
  }

  let parsedBasicInfo: any = null;
  let parsedAchievements = null;
  let parsedStats = null;
  
  if (basicInfoStr) {
    try { parsedBasicInfo = JSON.parse(basicInfoStr); } catch (e) { throw new Error('Basic Info JSON is invalid'); }
  } else {
    // Parse multi-select JSON arrays
    let nationalityArr: string[] = [];
    let positionArr: string[] = [];
    try { if (basicInfo_nationality_raw) nationalityArr = JSON.parse(basicInfo_nationality_raw); } catch {}
    try { if (basicInfo_position_raw) positionArr = JSON.parse(basicInfo_position_raw); } catch {}
    // Reconstruct from individual inputs
    parsedBasicInfo = {
      fullName: basicInfo_fullName || '',
      birthDate: basicInfo_birthDate || '',
      nationality: nationalityArr,
      height: basicInfo_height || '',
      position: positionArr,
      preferredFoot: basicInfo_preferredFoot || '',
      shirtNumber: basicInfo_shirtNumber || '',
      playerValue: basicInfo_playerValue || '',
      contractUntil: basicInfo_contractUntil || ''
    };
  }

  try { if (achievements) parsedAchievements = JSON.parse(achievements); } catch (e) { throw new Error('Achievements JSON is invalid'); }
  try { if (stats) parsedStats = JSON.parse(stats); } catch (e) { throw new Error('Stats JSON is invalid'); }

  await prisma.entity.create({
    data: {
      name,
      slug,
      type: type || 'FOOTBALL_PLAYER',
      avatar: avatar || null,
      clubId: clubId || null,
      basicInfo: parsedBasicInfo,
      achievements: parsedAchievements,
      stats: parsedStats,
    }
  });

  revalidatePath('/admin/entities');
  revalidatePath('/trung-tam-du-lieu');
  redirect('/admin/entities');
}

export async function updateEntity(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const type = formData.get('type') as string;
  const avatar = formData.get('avatar') as string;
  const clubId = formData.get('clubId') as string;
  // Extract basicInfo individual fields
  const basicInfo_fullName = formData.get('basicInfo_fullName') as string;
  const basicInfo_birthDate = formData.get('basicInfo_birthDate') as string;
  const basicInfo_nationality_raw = formData.get('basicInfo_nationality') as string;
  const basicInfo_height = formData.get('basicInfo_height') as string;
  const basicInfo_position_raw = formData.get('basicInfo_position') as string;
  const basicInfo_preferredFoot = formData.get('basicInfo_preferredFoot') as string;
  const basicInfo_shirtNumber = formData.get('basicInfo_shirtNumber') as string;
  const basicInfo_playerValue = formData.get('basicInfo_playerValue') as string;
  const basicInfo_contractUntil = formData.get('basicInfo_contractUntil') as string;

  const basicInfoStr = formData.get('basicInfo') as string; // Optional raw JSON fallback
  const achievements = formData.get('achievements') as string;
  const stats = formData.get('stats') as string;

  if (!name || !slug) {
    throw new Error('Name and slug are required');
  }

  let parsedBasicInfo: any = null;
  let parsedAchievements = null;
  let parsedStats = null;
  
  if (basicInfoStr) {
    try { parsedBasicInfo = JSON.parse(basicInfoStr); } catch (e) { throw new Error('Basic Info JSON is invalid'); }
  } else {
    // Parse multi-select JSON arrays
    let nationalityArr: string[] = [];
    let positionArr: string[] = [];
    try { if (basicInfo_nationality_raw) nationalityArr = JSON.parse(basicInfo_nationality_raw); } catch {}
    try { if (basicInfo_position_raw) positionArr = JSON.parse(basicInfo_position_raw); } catch {}
    // Reconstruct from individual inputs
    parsedBasicInfo = {
      fullName: basicInfo_fullName || '',
      birthDate: basicInfo_birthDate || '',
      nationality: nationalityArr,
      height: basicInfo_height || '',
      position: positionArr,
      preferredFoot: basicInfo_preferredFoot || '',
      shirtNumber: basicInfo_shirtNumber || '',
      playerValue: basicInfo_playerValue || '',
      contractUntil: basicInfo_contractUntil || ''
    };
  }

  try { if (achievements) parsedAchievements = JSON.parse(achievements); } catch (e) { throw new Error('Achievements JSON is invalid'); }
  try { if (stats) parsedStats = JSON.parse(stats); } catch (e) { throw new Error('Stats JSON is invalid'); }

  await prisma.entity.update({
    where: { id },
    data: {
      name,
      slug,
      type: type || 'FOOTBALL_PLAYER',
      avatar: avatar || null,
      clubId: clubId || null,
      basicInfo: parsedBasicInfo,
      achievements: parsedAchievements,
      stats: parsedStats,
    }
  });

  revalidatePath('/admin/entities');
  revalidatePath('/trung-tam-du-lieu');
  redirect('/admin/entities');
}

export async function deleteEntity(id: string) {
  await prisma.entity.delete({
    where: { id }
  });

  revalidatePath('/admin/entities');
  revalidatePath('/trung-tam-du-lieu');
}

export async function deleteMultipleEntities(ids: string[]) {
  if (!ids || ids.length === 0) return;
  await prisma.entity.deleteMany({
    where: {
      id: { in: ids }
    }
  });
  revalidatePath('/admin/entities');
  revalidatePath('/trung-tam-du-lieu');
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

export async function syncMultipleEntities(ids: string[]) {
  if (!ids || ids.length === 0) return { success: false, error: 'Không có cầu thủ nào được chọn' };

  let successCount = 0;
  
  for (const id of ids) {
    try {
      const entity = await prisma.entity.findUnique({ where: { id } });
      if (!entity) continue;

      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(entity.name)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.player && data.player.length > 0) {
          const p = data.player[0];
          
          const lRes = await fetch(`https://www.thesportsdb.com/api/v1/json/3/lookupplayer.php?id=${p.idPlayer}`);
          if (lRes.ok) {
            const lData = await lRes.json();
            if (lData.players && lData.players.length > 0) {
              const fullPlayer = lData.players[0];
              
              const pos = fullPlayer.strPosition || 'Forward';
              
              let currentBasicInfo: any = {};
              try {
                if (entity.basicInfo) currentBasicInfo = JSON.parse(entity.basicInfo);
              } catch (e) {}

              const mapPositionToCode = (p: string) => {
                const lower = p.toLowerCase();
                if (lower.includes('goalkeeper') || lower.includes('thủ môn')) return 'GK';
                if (lower.includes('centre-back') || lower.includes('centre back') || lower.includes('center back') || lower.includes('hậu vệ quét') || lower.includes('trung vệ')) return 'CB';
                if (lower.includes('left-back') || lower.includes('left back') || lower.includes('hậu vệ cánh trái')) return 'LB';
                if (lower.includes('right-back') || lower.includes('right back') || lower.includes('hậu vệ cánh phải')) return 'RB';
                if (lower.includes('defensive midfielder') || lower.includes('tiền vệ phòng ngự')) return 'DM';
                if (lower.includes('central midfielder') || lower.includes('tiền vệ trung tâm')) return 'CM';
                if (lower.includes('attacking midfielder') || lower.includes('tiền vệ tấn công')) return 'AM';
                if (lower.includes('left midfielder') || lower.includes('tiền vệ cánh trái')) return 'LM';
                if (lower.includes('right midfielder') || lower.includes('tiền vệ cánh phải')) return 'RM';
                if (lower.includes('left winger') || lower.includes('tiền đạo cánh trái')) return 'LW';
                if (lower.includes('right winger') || lower.includes('tiền đạo cánh phải')) return 'RW';
                return 'CF';
              };
              
              const positionAbbr = mapPositionToCode(pos);
              const decodedFullName = decodeHtmlEntities(fullPlayer.strPlayerAlternate || fullPlayer.strPlayer);
              const decodedName = decodeHtmlEntities(fullPlayer.strPlayer);

              const basicInfo = {
                ...currentBasicInfo,
                fullName: decodedFullName,
                birthDate: fullPlayer.dateBorn || currentBasicInfo.birthDate || '1998-01-01',
                height: fullPlayer.strHeight ? parseInt(fullPlayer.strHeight) || currentBasicInfo.height || '180' : '180',
                position: [positionAbbr],
                preferredFoot: fullPlayer.strSide || currentBasicInfo.preferredFoot || 'Right',
                shirtNumber: fullPlayer.strNumber || currentBasicInfo.shirtNumber || '10',
                playerValue: fullPlayer.strSigning || currentBasicInfo.playerValue || '1M €',
                excerpt: fullPlayer.strDescriptionEN ? decodeHtmlEntities(fullPlayer.strDescriptionEN.substring(0, 300)) : currentBasicInfo.excerpt || '',
                currentClub: fullPlayer.strTeam || currentBasicInfo.currentClub || ''
              };

              let currentStats: any = {};
              try {
                if (entity.stats) currentStats = JSON.parse(entity.stats);
              } catch (e) {}

              const attributes = currentStats.attributes || {
                ATT: positionAbbr === 'CF' || positionAbbr === 'LW' || positionAbbr === 'RW' ? 82 : 55,
                TEC: 78,
                TAC: positionAbbr === 'CB' || positionAbbr === 'DM' ? 78 : 55,
                DEF: positionAbbr === 'CB' || positionAbbr === 'GK' ? 80 : 35,
                CRE: positionAbbr === 'CM' || positionAbbr === 'AM' ? 80 : 60,
                STA: 75,
                PHY: 75
              };

              const sum = Object.values(attributes).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
              const avg = sum / Object.keys(attributes).length;
              const averageRating = (avg / 10).toFixed(1);

              const stats = {
                ...currentStats,
                attributes,
                averageRating,
                totalMatches: currentStats.totalMatches || 60,
                totalGoals: positionAbbr === 'CF' ? 22 : 4
              };

              let clubId = entity.clubId;
              if (fullPlayer.strTeam) {
                const cleanedClubName = fullPlayer.strTeam.replace(/\s*\(.*?\)\s*/g, '').trim();
                const clubSlug = cleanedClubName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
                const club = await prisma.club.findUnique({ where: { slug: clubSlug } });
                if (club) {
                  clubId = club.id;
                }
              }

              await prisma.entity.update({
                where: { id },
                data: {
                  name: decodedName,
                  avatar: fullPlayer.strThumb || entity.avatar,
                  clubId,
                  basicInfo: JSON.stringify(basicInfo),
                  stats: JSON.stringify(stats)
                }
              });

              successCount++;
            }
          }
        }
      }
    } catch (err) {
      console.error(`Sync error for player ID ${id}:`, err);
    }
  }

  revalidatePath('/admin/entities');
  revalidatePath('/trung-tam-du-lieu');

  return { success: true, count: successCount };
}
