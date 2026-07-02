import { Match } from "@/types/sport";

export const sportService = {
  getMatchesToday: async (): Promise<Match[]> => {
    try {
      const res = await fetch("/api/fixtures");
      const json = await res.json();
      if (!json.success || !json.data) {
        return [];
      }
      
      let fixtures: any[] = json.data;

      // Helper function to parse DD/MM/YYYY and HH:MM to a Date object using VN timezone (+07:00)
      const parseVNMatchDateTime = (dateStr: string, timeStr: string): Date | null => {
        try {
          const parts = dateStr.split("/");
          if (parts.length !== 3) return null;
          const [day, month, year] = parts.map(Number);
          const [hour, minute] = timeStr.split(":").map(Number);
          
          const isoStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`;
          const d = new Date(isoStr);
          return isNaN(d.getTime()) ? null : d;
        } catch {
          return null;
        }
      };

      // Get start of today (00:00) in VN time
      const getVNStartOfToday = (): Date => {
        const now = new Date();
        const vnFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = vnFormatter.formatToParts(now);
        const dd = parts.find(p => p.type === 'day')?.value || '01';
        const mm = parts.find(p => p.type === 'month')?.value || '01';
        const yyyy = parts.find(p => p.type === 'year')?.value || '2026';
        
        return new Date(`${yyyy}-${mm}-${dd}T00:00:00+07:00`);
      };

      const start = getVNStartOfToday();
      const end = new Date(start.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days limit (meaning up to 3 days after today)

      // Filter matches inside the 3-day range (today VN 00:00 to 3 days later 23:59:59)
      fixtures = fixtures.filter(f => {
        if (!f.matchDate || !f.matchTime) return false;
        const matchDate = parseVNMatchDateTime(f.matchDate, f.matchTime);
        if (!matchDate) return false;
        return matchDate >= start && matchDate < end;
      });

      // Danh sách các giải đấu lớn ưu tiên hiển thị
      const majorLeagues = [
        "FIFA World Cup",
        "UEFA Champions League",
        "UEFA Europa League",
        "English Premier League",
        "La Liga",
        "Serie A",
        "Bundesliga",
        "Ligue 1",
        "V-League"
      ];

      // Sắp xếp: Ưu tiên giải lớn lên đầu
      fixtures.sort((a, b) => {
        const aIndex = majorLeagues.findIndex(l => a.category?.includes(l));
        const bIndex = majorLeagues.findIndex(l => b.category?.includes(l));
        
        const aVal = aIndex === -1 ? 999 : aIndex;
        const bVal = bIndex === -1 ? 999 : bIndex;
        
        if (aVal !== bVal) {
          return aVal - bVal;
        }
        
        // Sắp xếp theo ngày và giờ tăng dần
        const dateCompare = (a.matchDate || "").localeCompare(b.matchDate || "");
        if (dateCompare !== 0) return dateCompare;
        return (a.matchTime || "").localeCompare(b.matchTime || "");
      });

      return fixtures.slice(0, 30).map((f) => {
        return {
          id: f.id,
          date: f.matchDate,
          time: f.matchTime,
          teamA: f.team1.name,
          teamB: f.team2.name,
          flagA: f.team1.logo || "⚽",
          flagB: f.team2.logo || "⚽",
          scoreA: f.score1 !== null && f.score1 !== undefined ? f.score1 : "-",
          scoreB: f.score2 !== null && f.score2 !== undefined ? f.score2 : "-",
          status: f.status || "Chưa đá",
          league: f.category || "Bóng đá",
          round: f.round || ""
        };
      });
    } catch (error) {
      console.error("Error fetching match schedule from API:", error);
      return [];
    }
  }
};
