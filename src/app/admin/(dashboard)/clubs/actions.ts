'use server';

import * as cheerio from 'cheerio';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createClub(formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const logo = formData.get('logo') as string;
  const sportType = formData.get('sportType') as string;
  const basicInfo = formData.get('basicInfo') as string;
  const wikiUrl = formData.get('wikiUrl') as string;

  const countryId = formData.get('countryId') as string;
  const leagueId = formData.get('leagueId') as string;
  const achievements = formData.get('achievements') as string;

  if (!name || !slug) {
    throw new Error('Name and slug are required');
  }

  await prisma.club.create({
    data: {
      name,
      slug,
      logo: logo || null,
      sportType: sportType || 'FOOTBALL',
      basicInfo: basicInfo || null,
      wikiUrl: wikiUrl || null,
      countryId: countryId || null,
      leagueId: leagueId || null,
      achievements: achievements || null,
    }
  });

  revalidatePath('/admin/clubs');
  revalidatePath('/trung-tam-du-lieu');
  redirect('/admin/clubs');
}

export async function updateClub(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const logo = formData.get('logo') as string;
  const sportType = formData.get('sportType') as string;
  const basicInfo = formData.get('basicInfo') as string;
  const wikiUrl = formData.get('wikiUrl') as string;

  const countryId = formData.get('countryId') as string;
  const leagueId = formData.get('leagueId') as string;
  const achievements = formData.get('achievements') as string;

  if (!name || !slug) {
    throw new Error('Name and slug are required');
  }

  await prisma.club.update({
    where: { id },
    data: {
      name,
      slug,
      logo: logo || null,
      sportType: sportType || 'FOOTBALL',
      basicInfo: basicInfo || null,
      wikiUrl: wikiUrl || null,
      countryId: countryId || null,
      leagueId: leagueId || null,
      achievements: achievements || null,
    }
  });

  revalidatePath('/admin/clubs');
  revalidatePath('/trung-tam-du-lieu');
  redirect('/admin/clubs');
}

export async function deleteClub(id: string) {
  await prisma.club.delete({
    where: { id }
  });

  revalidatePath('/admin/clubs');
  revalidatePath('/trung-tam-du-lieu');
}

export async function crawlClubs(league: string) {
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(league)}`);
    const data = await res.json();
    
    if (!data.teams) {
      return { success: false, error: 'Không tìm thấy dữ liệu cho giải đấu này.' };
    }
    
    let count = 0;
    for (const team of data.teams) {
      const slug = team.strTeam.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
      const basicInfo = JSON.stringify({
        formedYear: team.intFormedYear,
        stadium: team.strStadium,
        stadiumCapacity: team.intStadiumCapacity,
        location: team.strLocation,
        website: team.strWebsite,
        description: team.strDescriptionEN
      });
      
      await prisma.club.upsert({
        where: { slug },
        update: {
          name: team.strTeam,
          logo: team.strBadge || team.strLogo || null,
          sportType: 'FOOTBALL',
          basicInfo: basicInfo
        },
        create: {
          name: team.strTeam,
          slug: slug,
          logo: team.strBadge || team.strLogo || null,
          sportType: 'FOOTBALL',
          basicInfo: basicInfo
        }
      });
      count++;
    }
    
    revalidatePath('/admin/clubs');
    revalidatePath('/trung-tam-du-lieu');
    return { success: true, count };
  } catch (error: any) {
    console.error('Crawl Error:', error);
    return { success: false, error: error.message };
  }
}

export async function batchExtractWikipediaClubs(urls: string[], countryId?: string, leagueId?: string) {
  try {
    const results = [];
    const countries = await prisma.country.findMany();
    const leagues = await prisma.league.findMany();

    const targetUrls = [...urls];

    // Auto-crawl all teams in the league if selected and urls list is empty
    if (leagueId && targetUrls.length === 0) {
      const leagueObj = leagues.find(x => x.id === leagueId);
      if (leagueObj) {
        const staticLeagueTeams: {[key: string]: string[]} = {
          'premier league': [
            'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton & Hove Albion', 
            'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town', 
            'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United', 
            'Newcastle United', 'Nottingham Forest', 'Southampton', 'Tottenham Hotspur', 
            'West Ham United', 'Wolverhampton Wanderers'
          ],
          'bundesliga': [
            'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen', 'RB Leipzig', 
            'VfB Stuttgart', 'Eintracht Frankfurt', 'Hoffenheim', 'Heidenheim', 
            'Werder Bremen', 'Freiburg', 'Augsburg', 'Wolfsburg', 
            'Mainz 05', 'Borussia Mönchengladbach', 'Union Berlin', 'VfL Bochum', 
            'St. Pauli', 'Holstein Kiel'
          ],
          'la liga': [
            'Real Madrid', 'Barcelona', 'Girona', 'Atletico Madrid', 'Athletic Bilbao', 
            'Real Sociedad', 'Real Betis', 'Villarreal', 'Valencia', 'Alaves', 
            'Osasuna', 'Getafe', 'Celta Vigo', 'Sevilla', 'Mallorca', 
            'Las Palmas', 'Rayo Vallecano', 'Leganes', 'Real Valladolid', 'Espanyol'
          ],
          'serie a': [
            'Inter Milan', 'AC Milan', 'Juventus', 'Atalanta', 'Bologna', 
            'AS Roma', 'Lazio', 'Fiorentina', 'Torino', 'Napoli', 
            'Genoa', 'Monza', 'Verona', 'Lecce', 'Udinese', 
            'Cagliari', 'Empoli', 'Parma', 'Como', 'Venezia'
          ],
          'ligue 1': [
            'Paris Saint-Germain', 'Monaco', 'Lille', 'Brest', 'Nice', 
            'Lens', 'Lyon', 'Marseille', 'Reims', 'Rennes', 
            'Toulouse', 'Montpellier', 'Strasbourg', 'Le Havre', 'Nantes', 
            'Auxerre', 'Angers', 'Saint-Etienne'
          ],
          'v.league 1': [
            'Thép Xanh Nam Định', 'Hà Nội FC', 'Công An Hà Nội', 'Đông Á Thanh Hóa', 'Thể Công Viettel',
            'Hải Phòng FC', 'Becamex Bình Dương', 'Quy Nhơn Bình Định', 'Hồng Lĩnh Hà Tĩnh', 'Sông Lam Nghệ An',
            'Hoàng Anh Gia Lai', 'Quảng Nam FC', 'SHB Đà Nẵng', 'Hồ Chí Minh City FC'
          ]
        };

        const leagueKey = leagueObj.name.toLowerCase();
        
        // 1. Check if we have static teams list
        if (staticLeagueTeams[leagueKey]) {
          const teamNames = staticLeagueTeams[leagueKey];
          for (const name of teamNames) {
            // Find team from TheSportsDB
            try {
              const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.teams && data.teams.length > 0) {
                  // Find exact or closest match
                  const team = data.teams.find((t: any) => t.strTeam.toLowerCase() === name.toLowerCase()) || data.teams[0];
                  
                  const slug = team.strTeam.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                  
                  const existing = await prisma.club.findFirst({
                    where: {
                      OR: [
                        { slug },
                        { name: { equals: team.strTeam, mode: 'insensitive' } }
                      ]
                    }
                  });

                  if (existing) {
                    results.push({ url: team.strTeam, status: 'success', name: `${team.strTeam} (Đã tồn tại - Bỏ qua)` });
                    continue;
                  }

                  const basicInfo = JSON.stringify({
                    fullName: team.strTeam,
                    nickname: team.strAlternate || '',
                    formedYear: team.intFormedYear ? `${team.intFormedYear}-01-01` : '',
                    stadium: team.strStadium || '',
                    stadiumCapacity: team.intStadiumCapacity || '',
                    manager: '',
                    website: team.strWebsite || '',
                    description: team.strDescriptionEN || ''
                  });

                  await prisma.club.create({
                    data: {
                      name: team.strTeam,
                      slug,
                      logo: team.strBadge || team.strLogo || null,
                      sportType: 'FOOTBALL',
                      basicInfo,
                      countryId: countryId || leagueObj.countryId || null,
                      leagueId: leagueId,
                      achievements: '[]'
                    }
                  });
                  results.push({ url: team.strTeam, status: 'success', name: team.strTeam });
                }
              }
            } catch (err) {
              console.error(`Error crawling static team ${name}:`, err);
            }
          }
          revalidatePath('/admin/clubs');
          return { success: true, results };
        } else {
          // Fallback to name search on TheSportsDB (limited to 10 results but correct)
          const thesportsdbLeagueNames: {[key: string]: string} = {
            'ngoại hạng anh': 'English Premier League',
            'premier league': 'English Premier League',
            'hạng nhất anh': 'English Championship',
            'efl championship': 'English Championship',
            'efl league one': 'English League 1',
            'la liga': 'Spanish La Liga',
            'vô địch quốc gia tây ban nha': 'Spanish La Liga',
            'segunda división': 'Spanish La Liga 2',
            'serie a': 'Italian Serie A',
            'vô địch quốc gia ý': 'Italian Serie A',
            'vô địch quốc gia italia': 'Italian Serie A',
            'serie b': 'Italian Serie B',
            'bundesliga': 'German Bundesliga',
            'vô địch quốc gia đức': 'German Bundesliga',
            '2. bundesliga': 'German 2. Bundesliga',
            'ligue 1': 'French Ligue 1',
            'vô địch quốc gia pháp': 'French Ligue 1',
            'ligue 2': 'French Ligue 2',
            'v.league 1': 'Vietnamese V.League 1',
            'v-league': 'Vietnamese V.League 1'
          };
          const searchLeagueName = thesportsdbLeagueNames[leagueKey] || leagueObj.name;
          const fetchUrl = `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(searchLeagueName)}`;
          
          try {
            const apiRes = await fetch(fetchUrl);
            if (apiRes.ok) {
              const apiData = await apiRes.json();
              if (apiData.teams && apiData.teams.length > 0) {
                for (const team of apiData.teams) {
                  const slug = team.strTeam.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                  
                  const existing = await prisma.club.findFirst({
                    where: {
                      OR: [
                        { slug },
                        { name: { equals: team.strTeam, mode: 'insensitive' } }
                      ]
                    }
                  });

                  if (existing) {
                    results.push({ url: team.strTeam, status: 'success', name: `${team.strTeam} (Đã tồn tại - Bỏ qua)` });
                    continue;
                  }

                  const basicInfo = JSON.stringify({
                    fullName: team.strTeam,
                    nickname: team.strAlternate || '',
                    formedYear: team.intFormedYear ? `${team.intFormedYear}-01-01` : '',
                    stadium: team.strStadium || '',
                    stadiumCapacity: team.intStadiumCapacity || '',
                    manager: '',
                    website: team.strWebsite || '',
                    description: team.strDescriptionEN || ''
                  });

                  await prisma.club.create({
                    data: {
                      name: team.strTeam,
                      slug,
                      logo: team.strBadge || team.strLogo || null,
                      sportType: 'FOOTBALL',
                      basicInfo,
                      countryId: countryId || leagueObj.countryId || null,
                      leagueId: leagueId,
                      achievements: '[]'
                    }
                  });
                  results.push({ url: team.strTeam, status: 'success', name: team.strTeam });
                }
              }
            }
          } catch (err) {
            console.error("Fallback search all teams error:", err);
          }
          
          revalidatePath('/admin/clubs');
          return { success: true, results };
        }
      }
    }

    // Manual URLs or list of names
    for (const url of targetUrls) {
      if (!url.trim()) continue;
      
      const res = await extractWikipediaClub(url.trim());
      if (res.success && res.data) {
        let matchedCountryId: string | null = countryId || null;
        let matchedLeagueId: string | null = leagueId || null;

        if (!matchedCountryId) {
          if (res.data.country) {
            const c = countries.find(x => res.data.country.toLowerCase().includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(res.data.country.toLowerCase()));
            if (c) matchedCountryId = c.id;
          }
          if (!matchedCountryId && res.data.country) {
            const c = countries.find(x => x.slug.toLowerCase() === res.data.country.toLowerCase() || res.data.country.toLowerCase().includes(x.slug.toLowerCase()));
            if (c) matchedCountryId = c.id;
          }
        }

        if (!matchedLeagueId && res.data.league) {
          const leagueText = res.data.league.toLowerCase();
          const leagueAliases: {[key: string]: string} = {
            'ngoại hạng anh': 'premier league',
            'hạng nhất anh': 'efl championship',
            'hạng ba anh': 'efl league one',
            'vô địch quốc gia tây ban nha': 'la liga',
            'hạng nhất tây ban nha': 'la liga',
            'hạng hai tây ban nha': 'segunda división',
            'vô địch quốc gia ý': 'serie a',
            'vô địch quốc gia italia': 'serie a',
            'vô địch quốc gia đức': 'bundesliga',
            'hạng hai đức': '2. bundesliga',
            'vô địch quốc gia pháp': 'ligue 1',
            'hạng hai pháp': 'ligue 2',
            'v.league 1': 'v.league 1',
            'v.league 2': 'v.league 2',
            'v-league': 'v.league 1',
            'hạng nhất quốc gia': 'v.league 2'
          };
          
          let searchStr = leagueText;
          for (const [alias, realName] of Object.entries(leagueAliases)) {
            if (leagueText.includes(alias)) {
              searchStr = realName;
              break;
            }
          }

          const l = leagues.find(x => searchStr.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(searchStr) || x.slug.toLowerCase().includes(searchStr));
          if (l) matchedLeagueId = l.id;
          else {
            const lOrig = leagues.find(x => leagueText.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(leagueText) || leagueText.includes(x.slug.toLowerCase()));
            if (lOrig) matchedLeagueId = lOrig.id;
          }
        }

        if (!matchedCountryId && matchedLeagueId) {
          const l = leagues.find(x => x.id === matchedLeagueId);
          if (l && l.countryId) {
            matchedCountryId = l.countryId;
          }
        }
        
        if (!matchedLeagueId && matchedCountryId) {
           // If we have country but no league, default to the first league of that country
           const l = leagues.find(x => x.countryId === matchedCountryId);
           if (l) matchedLeagueId = l.id;
        }

        // Generate slug
        const slug = res.data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // Skip if already exists in manual crawl mode too
        const existing = await prisma.club.findFirst({
          where: {
            OR: [
              { slug },
              { name: { equals: res.data.name, mode: 'insensitive' } }
            ]
          }
        });

        if (existing) {
          results.push({ url, status: 'success', name: `${res.data.name} (Đã tồn tại - Bỏ qua)` });
          continue;
        }

        try {
          await prisma.club.create({
            data: {
              name: res.data.name,
              slug,
              logo: res.data.logo || null,
              sportType: 'FOOTBALL',
              basicInfo: res.data.basicInfo || null,
              countryId: matchedCountryId,
              leagueId: matchedLeagueId,
              achievements: JSON.stringify(res.data.achievements || [])
            }
          });
          results.push({ url, status: 'success', name: res.data.name });
        } catch (e: any) {
          results.push({ url, status: 'error', error: e.message });
        }
      } else {
        results.push({ url, status: 'error', error: res.error });
      }
    }
    
    revalidatePath('/admin/clubs');
    return { success: true, results };
  } catch (error) {
    return { success: false, error: 'Thao tác thất bại' };
  }
}

export async function syncSingleClub(id: string) {
  try {
    const club = await prisma.club.findUnique({
      where: { id }
    });

    if (!club || !club.wikiUrl) {
      return { success: false, error: 'Thiếu Link Wikipedia' };
    }

    const res = await extractWikipediaClub(club.wikiUrl.trim());
    if (res.success && res.data) {
      // Name is already cleaned in extractWikipediaClub now!
      const name = res.data.name;

      const existingClub = await prisma.club.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          id: { not: id } // Exclude self
        }
      });

      if (existingClub) {
        return { success: false, error: `Tên "${name}" bị trùng với CLB khác` };
      }

      // Find countries/leagues
      const countries = await prisma.country.findMany();
      const leagues = await prisma.league.findMany();

      let matchedCountryId: string | null = null;
      let matchedLeagueId: string | null = null;

      if (res.data.country) {
        const c = countries.find(x => res.data.country.toLowerCase().includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(res.data.country.toLowerCase()));
        if (c) matchedCountryId = c.id;
      }
      if (!matchedCountryId && res.data.country) {
        const c = countries.find(x => x.slug.toLowerCase() === res.data.country.toLowerCase() || res.data.country.toLowerCase().includes(x.slug.toLowerCase()));
        if (c) matchedCountryId = c.id;
      }

      if (res.data.league) {
        const l = leagues.find(x => res.data.league.toLowerCase().includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(res.data.league.toLowerCase()));
        if (l) matchedLeagueId = l.id;
      }
      if (!matchedLeagueId && res.data.league) {
        const l = leagues.find(x => x.slug.toLowerCase() === res.data.league.toLowerCase() || res.data.league.toLowerCase().includes(x.slug.toLowerCase()));
        if (l) matchedLeagueId = l.id;
      }

      await prisma.club.update({
        where: { id },
        data: {
          name,
          logo: res.data.logo || club.logo,
          basicInfo: res.data.basicInfo || club.basicInfo,
          countryId: matchedCountryId || club.countryId,
          leagueId: matchedLeagueId || club.leagueId,
          achievements: JSON.stringify(res.data.achievements || [])
        }
      });

      revalidatePath('/admin/clubs');
      revalidatePath('/trung-tam-du-lieu');

      return { success: true, name };
    } else {
      return { success: false, error: res.error || 'Trích xuất thất bại' };
    }
  } catch (error: any) {
    console.error("Sync error:", error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi đồng bộ' };
  }
}


export async function syncClubs(ids: string[]) {
  if (!ids || ids.length === 0) return { success: false, error: 'Không có CLB nào được chọn' };

  try {
    const clubs = await prisma.club.findMany({
      where: {
        id: { in: ids },
        wikiUrl: { not: null }
      }
    });

    if (clubs.length === 0) return { success: false, error: 'Các CLB đã chọn không có link Wiki để đồng bộ' };

    let successCount = 0;
    const countries = await prisma.country.findMany();
    const leagues = await prisma.league.findMany();

    for (const club of clubs) {
      if (!club.wikiUrl) continue;
      
      const res = await extractWikipediaClub(club.wikiUrl);
      if (res.success && res.data) {
        let matchedCountryId = club.countryId;
        let matchedLeagueId = club.leagueId;

        if (res.data.country) {
          const c = countries.find(x => res.data.country.toLowerCase().includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(res.data.country.toLowerCase()));
          if (c) matchedCountryId = c.id;
        }
        if (!matchedCountryId && res.data.country) {
          const c = countries.find(x => x.slug.toLowerCase() === res.data.country.toLowerCase() || res.data.country.toLowerCase().includes(x.slug.toLowerCase()));
          if (c) matchedCountryId = c.id;
        }

        if (res.data.league) {
          const leagueText = res.data.league.toLowerCase();
          const leagueAliases: {[key: string]: string} = {
            'ngoại hạng anh': 'premier league',
            'hạng nhất anh': 'efl championship',
            'hạng ba anh': 'efl league one',
            'vô địch quốc gia tây ban nha': 'la liga',
            'hạng nhất tây ban nha': 'la liga',
            'hạng hai tây ban nha': 'segunda división',
            'vô địch quốc gia ý': 'serie a',
            'vô địch quốc gia italia': 'serie a',
            'vô địch quốc gia đức': 'bundesliga',
            'hạng hai đức': '2. bundesliga',
            'vô địch quốc gia pháp': 'ligue 1',
            'hạng hai pháp': 'ligue 2',
            'v.league 1': 'v.league 1',
            'v.league 2': 'v.league 2',
            'v-league': 'v.league 1',
            'hạng nhất quốc gia': 'v.league 2'
          };
          
          let searchStr = leagueText;
          for (const [alias, realName] of Object.entries(leagueAliases)) {
            if (leagueText.includes(alias)) {
              searchStr = realName;
              break;
            }
          }

          const l = leagues.find(x => searchStr.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(searchStr) || x.slug.toLowerCase().includes(searchStr));
          if (l) matchedLeagueId = l.id;
          else {
            const lOrig = leagues.find(x => leagueText.includes(x.name.toLowerCase()) || x.name.toLowerCase().includes(leagueText) || leagueText.includes(x.slug.toLowerCase()));
            if (lOrig) matchedLeagueId = lOrig.id;
          }
        }

        if (!matchedCountryId && matchedLeagueId) {
          const l = leagues.find(x => x.id === matchedLeagueId);
          if (l && l.countryId) {
            matchedCountryId = l.countryId;
          }
        }
        
        if (!matchedLeagueId && matchedCountryId) {
           const l = leagues.find(x => x.countryId === matchedCountryId);
           if (l) matchedLeagueId = l.id;
        }

        await prisma.club.update({
          where: { id: club.id },
          data: {
            name: res.data.name,
            logo: res.data.logo || club.logo,
            basicInfo: res.data.basicInfo || club.basicInfo,
            countryId: matchedCountryId || club.countryId,
            leagueId: matchedLeagueId || club.leagueId,
            achievements: JSON.stringify(res.data.achievements || [])
          }
        });
        successCount++;
      }
    }

    revalidatePath('/admin/clubs');
    revalidatePath('/trung-tam-du-lieu');
    return { success: true, count: successCount, total: clubs.length };
  } catch (error: any) {
    console.error("Sync error:", error);
    return { success: false, error: error.message || 'Có lỗi xảy ra khi đồng bộ' };
  }
}

export async function deleteMultipleClubs(ids: string[]) {
  if (!ids || ids.length === 0) return;
  
  await prisma.club.deleteMany({
    where: {
      id: {
        in: ids
      }
    }
  });

  revalidatePath('/admin/clubs');
  revalidatePath('/trung-tam-du-lieu');
}

async function fetchClubFromTheSportsDB(nameOrUrl: string) {
  let name = nameOrUrl;
  if (nameOrUrl.includes('wikipedia.org')) {
    const parts = nameOrUrl.split('/wiki/');
    if (parts.length > 1) {
      name = decodeURIComponent(parts[1]).replace(/_/g, ' ');
    }
  }
  
  const searchName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
  
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(searchName)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.teams && data.teams.length > 0) {
        // Find the closest name match
        const exactMatch = data.teams.find((t: any) => 
          t.strTeam.toLowerCase() === searchName.toLowerCase() ||
          t.strAlternate?.toLowerCase().includes(searchName.toLowerCase())
        );
        return exactMatch || data.teams[0];
      }
    }
  } catch (e) {
    console.error("Error searching TheSportsDB:", e);
  }
  return null;
}

export async function extractWikipediaClub(url: string) {
  try {
    // 1. Try to fetch from TheSportsDB first for speed & standard naming
    const team = await fetchClubFromTheSportsDB(url);
    if (team) {
      const basicInfo = {
        fullName: team.strTeam,
        nickname: team.strAlternate || '',
        formedYear: team.intFormedYear ? `${team.intFormedYear}-01-01` : '',
        stadium: team.strStadium || '',
        stadiumCapacity: team.intStadiumCapacity || '',
        manager: '',
        website: team.strWebsite || '',
        description: team.strDescriptionEN || ''
      };
      
      return {
        success: true,
        data: {
          name: team.strTeam,
          logo: team.strBadge || team.strLogo || '',
          country: team.strCountry || '',
          league: team.strLeague || '',
          achievements: [],
          basicInfo: JSON.stringify(basicInfo)
        }
      };
    }

    // 2. Fallback to Wikipedia scrape if not found on TheSportsDB
    if (!url.includes('wikipedia.org')) {
      return { success: false, error: 'Vui lòng nhập link Wikipedia hợp lệ hoặc tên đội bóng hợp lệ' };
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (!res.ok) {
      return { success: false, error: 'Không thể truy cập link Wikipedia' };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const infobox = $('table.infobox.vcard');
    if (infobox.length === 0) {
      return { success: false, error: 'Không tìm thấy bảng thông tin (Infobox) trên trang này' };
    }

    let logo = '';
    const imgEl = infobox.find('.infobox-image img').first();
    if (imgEl.length > 0) {
      const src = imgEl.attr('src');
      if (src) {
        logo = src.startsWith('//') ? `https:${src}` : src;
        logo = logo.replace(/\/thumb\//, '/');
        const match = logo.match(/(\.png|\.jpg|\.svg)/);
        if (match) {
           const extIndex = logo.indexOf(match[0]) + match[0].length;
           logo = logo.substring(0, extIndex);
        }
      }
    }

    const data: any = { logo };

    infobox.find('tr').each((_, row) => {
      const label = $(row).find('th.infobox-label').text().trim().toLowerCase();
      let value = $(row).find('td.infobox-data').text().trim();
      
      // Remove citations like [1], [2a]
      value = value.replace(/\[.*?\]/g, '').trim();

      if (label.includes('tên đầy đủ') || label.includes('full name')) data.fullName = value;
      else if (label.includes('biệt danh') || label.includes('nickname')) data.nickname = value;
      else if (label.includes('thành lập') || label.includes('founded')) data.founded = value.split(';')[0].trim();
      else if (label.includes('sân') || label.includes('ground') || label.includes('stadium')) data.stadium = value;
      else if (label.includes('sức chứa') || label.includes('capacity')) data.capacity = value;
      else if (label.includes('quản lý') || label.includes('huấn luyện viên') || label.includes('manager') || label.includes('head coach')) data.manager = value;
      else if (label.includes('trang web') || label.includes('website')) {
        const link = $(row).find('td.infobox-data a').attr('href');
        data.website = link || value;
      }
      else if (label.includes('giải đấu') || label.includes('league')) data.league = value;
      else if (label.includes('quốc gia') || label.includes('country')) data.country = value;
      else if (label.includes('danh hiệu') || label.includes('chức vô địch') || label.includes('honours')) {
        // usually achievements are list items
        const achList: {league: string, rank: string, year: string}[] = [];
        $(row).find('td.infobox-data ul li').each((_, li) => {
           const text = $(li).text().trim();
           achList.push({ league: text, rank: 'Vô địch', year: '' });
        });
        if (achList.length > 0) {
          data.achievements = achList;
        } else {
          data.achievements = [{ league: value, rank: 'Vô địch', year: '' }];
        }
      }
    });

    let name = $('h1#firstHeading').text();
    
    // Clean up disambiguation
    name = name.replace(/\s*\(.*?\)\s*/g, '').trim();

    const prefixesSuffixes = [
      '^Câu lạc bộ bóng đá ', '^Câu lạc bộ ', 
      '\\bF\\.C\\.\\b', '\\bFC\\b', '\\bA\\.F\\.C\\.\\b', '\\bAFC\\b', '\\bFootball Club\\b', '\\bFútbol Club\\b', '\\bFútbol Club\\b', '\\bClub de Fútbol\\b',
      '\\bS\\.r\\.l\\.\\b', '\\bs\\.r\\.l\\.\\b', '\\bS\\.R\\.L\\.\\b', '\\bSrl\\b',
      '\\bS\\.p\\.A\\.\\b', '\\bSpA\\b',
      '\\bA\\.S\\.\\b', '\\bS\\.S\\.\\b', '\\bU\\.S\\.\\b', '\\bSC\\b', '\\bS\\.C\\.\\b',
      '\\bAssociazione Sportiva\\b', '\\bSocietà Sportiva\\b', '\\bUnione Sportiva\\b', '\\bAssociazione Calcistica\\b',
      '\\bFußball-Club\\b', '\\bFußball Club\\b', '\\bFussballclub\\b', '\\b1\\.\\s*FC\\b', '\\b1\\.\\s*Fußball-Club\\b',
      '\\bSportverein\\b', '\\bTurn-\\s*und\\s*Sportverein\\b', '\\bDeutscher\\s*Sport-Club\\b', '\\bMeidericher\\s*Spielverein\\b', '\\bSpielvereinigung\\b', '\\bSport-Club\\b', '\\bVerein\\s*für\\s*Leibesübungen\\b',
      '\\be\\.\\s*V\\.\\b', '\\be\\.V\\.\\b',
      '\\bS\\.A\\.D\\.\\b',
      '\\bClub Atlético\\b', '\\bRacing Club\\b', '\\bUnión Deportiva\\b', '\\bBalompié\\b',
      '\\bDelfino\\b', '\\bCalcio\\b',
      '\\bVfL\\b', '\\bSV\\b', '\\bTSG\\b', '\\bFSV\\b', '\\bVfB\\b',
      '^1\\.\\s+', '\\b(?:18|19)\\d{2}\\b'
    ];
    const regex = new RegExp(`(${prefixesSuffixes.join('|')})`, 'ig');
    name = name.replace(regex, '').trim();
    name = name.replace(/Mühlburg-Phönix/ig, '').trim();
    name = name.replace(/\s+von\s*$/i, '').trim();
    name = name.replace(/,\s*$/, '').trim();
    name = name.replace(/\s+/g, ' ').trim();
    name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

    // Use AI to standardize name to standard English/Vietnamese common football names
    try {
      const { generateWithFallback } = await import('@/lib/aiBox');
      const aiPrompt = `Bạn là một chuyên gia bóng đá thế giới. Tôi có tên câu lạc bộ bóng đá lấy từ Wikipedia tiếng Việt/Đức/Anh là: "${name}".
Hãy trả về duy nhất tên phổ biến nhất của câu lạc bộ này bằng tiếng Anh (hoặc tiếng Việt chuẩn bóng đá quốc tế, không chứa các từ viết tắt rác như FC, SC, SV, F.C. ở đầu hoặc cuối trừ khi nó là một phần bắt buộc của thương hiệu thương mại rất phổ biến như AC Milan).
Ví dụ:
- "Bayern Munchen" hoặc "Bayern Munich" -> "Bayern Munich"
- "Manchester United" -> "Manchester United"
- "Internazionale" hoặc "Inter Milano" -> "Inter Milan"
- "Milan" -> "AC Milan"
- "Sporting CP" hoặc "Sporting Clube de Portugal" -> "Sporting Lisbon"
- "Athletic Club" -> "Athletic Bilbao"
- "Real Madrid" -> "Real Madrid"
- "Roma" -> "AS Roma"
- "Monchengladbach" -> "Borussia Monchengladbach"

Chỉ trả về chuỗi tên sạch nhất, không bao gồm bất kỳ dấu ngoặc kép, dấu chấm câu hay giải thích nào khác. Tên cần trả về:`;
      const standardized = await generateWithFallback(aiPrompt, "You are a football naming expert. Return only the most common name.", true);
      if (standardized && standardized.trim().length > 2) {
        name = standardized.trim().replace(/^["']|["']$/g, '');
      }
    } catch (e) {
      console.error("Lỗi AI khi chuẩn hóa tên CLB:", e);
    }

    // Parse date from "D tháng M năm YYYY" or "YYYY" to YYYY-MM-DD
    let formattedDate = '';
    if (data.founded) {
      const match = data.founded.match(/(\d{1,2})\s+tháng\s+(\d{1,2})\s+(?:năm\s+)?(\d{4})/i);
      if (match) {
        const d = match[1].padStart(2, '0');
        const m = match[2].padStart(2, '0');
        const y = match[3];
        formattedDate = `${y}-${m}-${d}`;
      } else {
        const yearMatch = data.founded.match(/(\d{4})/);
        if (yearMatch) {
          formattedDate = `${yearMatch[1]}-01-01`;
        } else {
          formattedDate = data.founded;
        }
      }
    }

    // Lấy đoạn giới thiệu đầu tiên có độ dài phù hợp
    let firstParagraph = '';
    $('#mw-content-text .mw-parser-output > p').not('.mw-empty-elt').each((_, el) => {
      const text = $(el).text().replace(/\[.*?\]/g, '').trim();
      if (text.length > 50 && !firstParagraph) {
        firstParagraph = text;
      }
    });

    // Extract achievements from body if not found in infobox
    if (!data.achievements || data.achievements.length === 0) {
      const achList: {league: string, rank: string, year: string}[] = [];
      
      const titles = $('#mw-content-text .mw-parser-output').find('h2, h3, b, th, span.mw-headline, div > b').filter((_, el) => {
        const text = $(el).text().toLowerCase();
        return (text.includes('danh hiệu') || text.includes('thành tích') || text.includes('lịch sử') || text.includes('hoạt động') || text.includes('honours')) && text.length < 50;
      });

      titles.each((_, titleEl) => {
         const $title = $(titleEl);
         let uls: any = $();
         
         if ($title.is('h2') || $title.is('h3') || $title.hasClass('mw-headline')) {
            let container = $title.closest('h2, h3').length > 0 ? $title.closest('h2, h3') : $title;
            // Go up until we find a sibling
            while (container.parent().length > 0 && !container.parent().hasClass('mw-parser-output')) {
                if (container.next().length > 0 && !container.next().is('style') && !container.next().is('link')) break;
                container = container.parent();
            }
            let current = container.next();
            
            while(current.length > 0 && !current.is('h2') && !current.is('h3')) {
              if (current.is('ul')) uls = uls.add(current);
              else if (current.find('ul').length > 0) uls = uls.add(current.find('ul'));
              current = current.next();
            }
         } else {
            // It's inside a custom box/table like Liverpool's "Tóm tắt lịch sử"
            const container = $title.closest('div[style*="border"], table').nextAll('div, table').addBack();
            uls = container.find('ul');
         }

         uls.find('> li').each((_: any, li: any) => {
             let text = $(li).text().replace(/\[.*?\]/g, '').trim();
             text = text.split('\n')[0].trim(); // ignore sublists
             
             // Must contain year or rank keywords to be an achievement
             if (text && text.length > 5 && text.length < 150 && (text.includes('vô địch') || text.includes('hạng') || text.match(/\d{4}/))) {
                let year = '';
                const yearMatch = text.match(/(\d{4}(?:[-–]\d{2,4})?)/);
                if (yearMatch) {
                  year = yearMatch[1];
                }
                
                let rank = 'Vô địch';
                const lower = text.toLowerCase();
                if (lower.includes('á quân') || lower.includes('đứng thứ 2')) rank = 'Á quân';
                else if (lower.includes('hạng ba') || lower.includes('đứng thứ 3') || lower.includes('thứ 3')) rank = 'Hạng ba';
                else if (lower.includes('xuống hạng')) rank = 'Xuống hạng';
                else if (!lower.includes('vô địch')) rank = 'Tham dự';
                
                const exists = achList.some(a => a.league === text && a.year === year);
                if (!exists) {
                  achList.push({ league: text, rank, year });
                }
             }
         });
      });

      if (achList.length > 0) {
        data.achievements = achList;
      }
    }

    const basicInfo = {
      fullName: data.fullName ? data.fullName.replace(/Câu lạc bộ bóng đá /ig, '').replace(/Câu lạc bộ /ig, '').trim() : name,
      nickname: data.nickname || '',
      formedYear: formattedDate || data.founded || '',
      stadium: data.stadium || '',
      stadiumCapacity: data.capacity || '',
      manager: data.manager || '',
      website: data.website || '',
      description: firstParagraph || ''
    };

    return { 
      success: true, 
      data: {
        name,
        logo: data.logo,
        country: data.country || '',
        league: data.league || '',
        achievements: data.achievements || [],
        basicInfo: JSON.stringify(basicInfo)
      } 
    };

  } catch (error: any) {
    console.error('Wiki extract error:', error);
    return { success: false, error: error.message };
  }
}
