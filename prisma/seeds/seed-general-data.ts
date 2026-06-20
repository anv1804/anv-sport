import { PrismaClient } from '@prisma/client';
import { COUNTRIES } from '../../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sports...');
  const sportsData = [
    { name: 'Bóng đá', slug: 'bong-da', icon: '⚽' },
    { name: 'Bóng rổ', slug: 'bong-ro', icon: '🏀' },
    { name: 'Quần vợt', slug: 'quan-vot', icon: '🎾' },
    { name: 'Bóng chuyền', slug: 'bong-chuyen', icon: '🏐' },
    { name: 'Cầu lông', slug: 'cau-long', icon: '🏸' },
    { name: 'Billiards', slug: 'billiards', icon: '🎱' },
    { name: 'Đua xe F1', slug: 'dua-xe-f1', icon: '🏎️' },
    { name: 'Esports', slug: 'esports', icon: '🎮' },
    { name: 'Golf', slug: 'golf', icon: '⛳' },
  ];

  const sportsMap: Record<string, string> = {};
  for (const s of sportsData) {
    try {
      const sport = await prisma.sport.upsert({
        where: { slug: s.slug },
        update: s,
        create: s,
      });
      sportsMap[s.name] = sport.id;
    } catch (e) {
      console.error(`Failed sport ${s.name}:`, e);
    }
  }

  console.log('Seeding countries...');
  const countriesMap: Record<string, string> = {};
  for (const c of COUNTRIES) {
    try {
      const flagUrl = `https://flagcdn.com/w40/${c.iso2.toLowerCase()}.png`;
      const country = await prisma.country.upsert({
        where: { slug: c.code }, 
        update: { name: c.name, code: c.code, flag: flagUrl },
        create: { name: c.name, slug: c.code, code: c.code, flag: flagUrl },
      });
      countriesMap[c.name] = country.id;
    } catch (e) {
      console.error(`Failed country ${c.name}:`, e);
    }
  }

  console.log('Seeding leagues...');
  const footballId = sportsMap['Bóng đá'];

  if (!footballId) {
    console.error("Football not found!");
    return;
  }

  const leaguesData = [
    // ANH
    { name: 'Ngoại hạng Anh', slug: 'ngoai-hang-anh', countryName: 'Anh' },
    { name: 'Championship', slug: 'championship', countryName: 'Anh' },
    { name: 'League One', slug: 'league-one', countryName: 'Anh' },
    // TÂY BAN NHA
    { name: 'La Liga', slug: 'la-liga', countryName: 'Tây Ban Nha' },
    { name: 'Segunda División', slug: 'segunda-division', countryName: 'Tây Ban Nha' },
    { name: 'Primera Federación', slug: 'primera-federacion', countryName: 'Tây Ban Nha' },
    // ĐỨC
    { name: 'Bundesliga', slug: 'bundesliga', countryName: 'Đức' },
    { name: '2. Bundesliga', slug: '2-bundesliga', countryName: 'Đức' },
    { name: '3. Liga', slug: '3-liga', countryName: 'Đức' },
    // Ý
    { name: 'Serie A', slug: 'serie-a', countryName: 'Ý' },
    { name: 'Serie B', slug: 'serie-b', countryName: 'Ý' },
    { name: 'Serie C', slug: 'serie-c', countryName: 'Ý' },
    // PHÁP
    { name: 'Ligue 1', slug: 'ligue-1', countryName: 'Pháp' },
    { name: 'Ligue 2', slug: 'ligue-2', countryName: 'Pháp' },
    { name: 'Championnat National', slug: 'championnat-national', countryName: 'Pháp' },
    // VIỆT NAM
    { name: 'V-League 1', slug: 'v-league-1', countryName: 'Việt Nam' },
    { name: 'V-League 2', slug: 'v-league-2', countryName: 'Việt Nam' },
    { name: 'Hạng Nhì Quốc gia', slug: 'hang-nhi-quoc-gia', countryName: 'Việt Nam' },
    // QUỐC TẾ
    { name: 'Cúp C1 Châu Âu (Champions League)', slug: 'champions-league', countryName: null },
    { name: 'Cúp C2 Châu Âu (Europa League)', slug: 'europa-league', countryName: null },
    { name: 'World Cup', slug: 'world-cup', countryName: null },
  ];

  for (const l of leaguesData) {
    try {
      const countryId = l.countryName ? countriesMap[l.countryName] : null;
      await prisma.league.upsert({
        where: { slug: l.slug },
        update: {
          name: l.name,
          sportId: footballId,
          countryId: countryId,
        },
        create: {
          name: l.name,
          slug: l.slug,
          sportId: footballId,
          countryId: countryId,
        },
      });
    } catch (e) {
      console.error(`Failed league ${l.name}:`, e);
    }
  }

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
