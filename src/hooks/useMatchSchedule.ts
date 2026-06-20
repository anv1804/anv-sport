import { useState, useEffect } from "react";
import { sportService } from "@/services/sportService";
import { Match } from "@/types/sport";

export function useMatchSchedule() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await sportService.getMatchesToday();
        setMatches(data);
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
