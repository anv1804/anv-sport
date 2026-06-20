import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting existing leagues...');
  await prisma.league.deleteMany();

  console.log('Fetching dependencies...');
  const football = await prisma.sport.findUnique({ where: { slug: 'bong-da' } });
  if (!football) {
    console.error("Football not found!");
    return;
  }

  const countries = await prisma.country.findMany();
  const countriesMap: Record<string, string> = {};
  for (const c of countries) {
    countriesMap[c.name] = c.id;
  }

  const leaguesData = [
    // ANH
    { name: 'Premier League (Ngoại hạng Anh)', slug: 'premier-league', countryName: 'Anh', description: 'Giải đấu hạng cao nhất trong hệ thống các giải bóng đá Anh' },
    { name: 'EFL Championship', slug: 'efl-championship', countryName: 'Anh', description: 'Giải đấu hạng hai trong hệ thống các giải bóng đá Anh' },
    { name: 'EFL League One', slug: 'efl-league-one', countryName: 'Anh', description: 'Giải đấu hạng ba trong hệ thống các giải bóng đá Anh' },
    // TÂY BAN NHA
    { name: 'La Liga', slug: 'la-liga', countryName: 'Tây Ban Nha', description: 'Giải bóng đá vô địch quốc gia Tây Ban Nha' },
    { name: 'Segunda División', slug: 'segunda-division', countryName: 'Tây Ban Nha', description: 'Giải đấu hạng hai Tây Ban Nha' },
    { name: 'Primera Federación', slug: 'primera-federacion', countryName: 'Tây Ban Nha', description: 'Giải đấu hạng ba Tây Ban Nha' },
    // ĐỨC
    { name: 'Bundesliga', slug: 'bundesliga', countryName: 'Đức', description: 'Giải bóng đá vô địch quốc gia Đức' },
    { name: '2. Bundesliga', slug: '2-bundesliga', countryName: 'Đức', description: 'Giải đấu hạng hai Đức' },
    { name: '3. Liga', slug: '3-liga', countryName: 'Đức', description: 'Giải đấu hạng ba Đức' },
    // Ý
    { name: 'Serie A', slug: 'serie-a', countryName: 'Ý', description: 'Giải bóng đá vô địch quốc gia Ý' },
    { name: 'Serie B', slug: 'serie-b', countryName: 'Ý', description: 'Giải đấu hạng hai Ý' },
    { name: 'Serie C', slug: 'serie-c', countryName: 'Ý', description: 'Giải đấu hạng ba Ý' },
    // PHÁP
    { name: 'Ligue 1', slug: 'ligue-1', countryName: 'Pháp', description: 'Giải bóng đá vô địch quốc gia Pháo' },
    { name: 'Ligue 2', slug: 'ligue-2', countryName: 'Pháp', description: 'Giải đấu hạng hai Pháp' },
    { name: 'Championnat National', slug: 'championnat-national', countryName: 'Pháp', description: 'Giải đấu hạng ba Pháp' },
    // VIỆT NAM
    { name: 'V.League 1', slug: 'v-league-1', countryName: 'Việt Nam', description: 'Giải bóng đá vô địch quốc gia Việt Nam' },
    { name: 'V.League 2', slug: 'v-league-2', countryName: 'Việt Nam', description: 'Giải hạng nhất quốc gia Việt Nam' },
    { name: 'Giải Hạng Nhì Quốc gia', slug: 'hang-nhi-quoc-gia', countryName: 'Việt Nam', description: 'Giải hạng nhì quốc gia Việt Nam' },
    // QUỐC TẾ
    { name: 'UEFA Champions League (Cúp C1)', slug: 'champions-league', countryName: null, description: 'Giải đấu danh giá nhất cấp câu lạc bộ châu Âu' },
    { name: 'UEFA Europa League (Cúp C2)', slug: 'europa-league', countryName: null, description: 'Giải đấu hạng hai cấp câu lạc bộ châu Âu' },
    { name: 'FIFA World Cup', slug: 'world-cup', countryName: null, description: 'Giải vô địch bóng đá thế giới cấp đội tuyển quốc gia' },
  ];

  for (const l of leaguesData) {
    try {
      const countryId = l.countryName ? countriesMap[l.countryName] : null;
      await prisma.league.create({
        data: {
          name: l.name,
          slug: l.slug,
          sportId: football.id,
          countryId: countryId,
          description: l.description,
        },
      });
      console.log(`Created ${l.name}`);
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
