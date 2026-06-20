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
