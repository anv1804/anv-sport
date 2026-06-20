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
      const slug = team.strTeam.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      
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
          logo: team.strTeamBadge,
          sportType: 'FOOTBALL',
          basicInfo: basicInfo
        },
        create: {
          name: team.strTeam,
          slug: slug,
          logo: team.strTeamBadge,
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

export async function batchExtractWikipediaClubs(urls: string[]) {
  try {
    const results = [];
    const countries = await prisma.country.findMany();
    const leagues = await prisma.league.findMany();

    for (const url of urls) {
      if (!url.trim()) continue;
      
      const res = await extractWikipediaClub(url.trim());
      if (res.success && res.data) {
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
        const slug = res.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

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

export async function extractWikipediaClub(url: string) {
  try {
    if (!url.includes('wikipedia.org')) {
      return { success: false, error: 'Vui lòng nhập link Wikipedia hợp lệ' };
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

    // Clean up name aggressively for international standards
    const prefixesSuffixes = [
      'Câu lạc bộ bóng đá ', 'Câu lạc bộ ', 
      ' F\\.C\\.', ' FC', ' A\\.F\\.C\\.', ' AFC', 'Football Club ', ' Fútbol Club', 'Fútbol Club ', 'Club de Fútbol ', ' Club de Fútbol',
      ' S\\.r\\.l\\.', ' s\\.r\\.l\\.', ' S\\.R\\.L\\.', ' S\\.R\\.L', ' Srl',
      ' S\\.p\\.A\\.', ' S\\.p\\.A', ' SpA',
      ' A\\.S\\.', ' S\\.S\\.', ' U\\.S\\.',
      'Associazione Sportiva ', 'Società Sportiva ', 'Unione Sportiva ', 'Associazione Calcistica ',
      'Fußball-Club ', 'Fußball Club ', 'Fussballclub ', '1\\. FC ', '1\\. Fußball-Club ',
      'Sportverein ', 'Turn- und Sportverein ', 'Deutscher Sport-Club ', 'Meidericher Spielverein ', 'Spielvereinigung ', 'Sport-Club ', 'Verein für Leibesübungen ',
      ' e\\. V\\.', ' e\\.V\\.', ' e\\. V', 'e\\.V\\.',
      ', S\\.A\\.D\\.', ' S\\.A\\.D\\.', ' S\\.A\\.D', 'S\\.A\\.D\\.',
      'Club Atlético ', 'Racing Club ', 'Unión Deportiva ', 'Balompié',
      'Delfino ', 'Calcio '
    ];
    const regex = new RegExp(`(${prefixesSuffixes.join('|')})`, 'ig');
    name = name.replace(regex, '').trim();
    name = name.replace(/Mühlburg-Phönix/ig, '').trim();
    name = name.replace(/\s+von\s*$/i, '').trim();
    name = name.replace(/,\s*$/, '').trim();

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
