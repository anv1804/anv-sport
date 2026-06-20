import { Match, TheSportsDBEvent } from "@/types/sport";
import { getDateFormattedWithOffset, getVietnamTimeFromUTC } from "@/utils/dateUtils";

const API_BASE_URL = "/api/sportsdb";

export const sportService = {
  getMatchesToday: async (): Promise<Match[]> => {
    try {
      const dates = [
        getDateFormattedWithOffset(0),
        getDateFormattedWithOffset(1),
        getDateFormattedWithOffset(2)
      ];
      
      const fetchPromises = dates.map(date => 
        fetch(`${API_BASE_URL}/eventsday.php?d=${date}&s=Soccer`).then(res => res.json())
      );
      
      const results = await Promise.all(fetchPromises);
      
      let allEvents: TheSportsDBEvent[] = [];
      results.forEach(data => {
        if (data.events) {
          allEvents = [...allEvents, ...data.events];
        }
      });

      // Danh sách các giải đấu lớn ưu tiên hiển thị (để tránh hiển thị giải cỏ)
      const majorLeagues = [
        "FIFA World Cup",
        "UEFA Euro",
        "Copa America",
        "UEFA Champions League",
        "UEFA Europa League",
        "English Premier League",
        "Spanish La Liga",
        "Italian Serie A",
        "German Bundesliga",
        "French Ligue 1",
        "V-League"
      ];

      // LỌC BỎ HOÀN TOÀN GIẢI CỎ: Chỉ giữ lại các giải đấu có tên trong danh sách VIP
      allEvents = allEvents.filter(event => 
        majorLeagues.some(l => event.strLeague?.includes(l))
      );

      // Sắp xếp: Ưu tiên giải lớn (đứng trước trong mảng) lên đầu
      // Sort chronologically as well if we want, but major leagues are prioritized
      allEvents.sort((a, b) => {
        const aIndex = majorLeagues.findIndex(l => a.strLeague?.includes(l));
        const bIndex = majorLeagues.findIndex(l => b.strLeague?.includes(l));
        
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        
        // Cùng giải thì xếp theo thời gian
        return (a.strTimestamp || "").localeCompare(b.strTimestamp || "");
      });

      return allEvents.slice(0, 30).map((event) => {
        const { displayDate, time } = getVietnamTimeFromUTC(event.strTimestamp || "");
        
        let roundText = event.intRound ? `Vòng ${event.intRound}` : "";
        if (event.strLeague?.includes("Group")) {
          roundText = event.strLeague;
        }

        return {
          id: event.idEvent,
          date: displayDate,
          time: time,
          teamA: event.strHomeTeam,
          teamB: event.strAwayTeam,
          flagA: event.strHomeTeamBadge || "⚽",
          flagB: event.strAwayTeamBadge || "⚽",
          scoreA: event.intHomeScore ?? "-",
          scoreB: event.intAwayScore ?? "-",
          status: event.strStatus || "Chưa diễn ra",
          league: event.strLeague || "Bóng đá",
          round: roundText
        };
      });
    } catch (error) {
      console.error("Error fetching match schedule:", error);
      return [];
    }
  }
};
