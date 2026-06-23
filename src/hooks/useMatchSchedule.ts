import { useState, useEffect } from "react";
import { sportService } from "@/services/sportService";
import { Match } from "@/types/sport";

const CACHE_KEY = "anv_sport_matches_cache";
const CACHE_TIME_KEY = "anv_sport_matches_cache_time";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function useMatchSchedule() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      // Check cache first
      try {
        const cachedData = sessionStorage.getItem(CACHE_KEY);
        const cachedTime = sessionStorage.getItem(CACHE_TIME_KEY);
        
        if (cachedData && cachedTime) {
          const isExpired = Date.now() - parseInt(cachedTime, 10) > CACHE_DURATION;
          if (!isExpired) {
            setMatches(JSON.parse(cachedData));
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        // Fallback if sessionStorage is disabled or unavailable
      }

      setIsLoading(true);
      setError(null);
      try {
        const data = await sportService.getMatchesToday();
        setMatches(data);
        
        // Save to cache
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          sessionStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {}
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi khi tải lịch thi đấu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return { matches, isLoading, error };
}
