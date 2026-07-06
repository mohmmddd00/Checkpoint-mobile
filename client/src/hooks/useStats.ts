import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export interface StatEntry {
  label: string;
  count: number;
}

export interface YearEntry {
  year: string;
  count: number;
}

export interface MonthEntry {
  label: string;
  key: string;
  count: number;
}

export interface GameHighlight {
  title: string;
  rating: number;
  coverImage: string | null;
}

export interface MostLikedReview {
  _id: string;
  title: string;
  review: string;
  rating: number;
  coverImage: string | null;
  likeCount: number;
}

export interface MostSavedVault {
  _id: string;
  title: string;
  games: { coverImage: string | null }[];
  saveCount: number;
}

export interface RecentActivityEntry {
  _id: string;
  title: string;
  platform: string;
  status: string;
  rating: number;
  coverImage: string | null;
  timestamp: string;
}

export interface UserStats {
  totalLogged: number;
  completed: number;
  playing: number;
  dropped: number;
  averageRating: number | null;
  highestRated: GameHighlight | null;
  lowestRated: GameHighlight | null;
  totalReviews: number;
  ratingDistribution: StatEntry[];
  statusBreakdown: { Completed: number; Playing: number; Dropped: number };
  platformBreakdown: { platform: string; count: number }[];
  mostActiveMonth: string | null;
  mostActiveYear: string | null;
  activityByMonth: MonthEntry[];
  activityByYear: YearEntry[];
  recentActivity: RecentActivityEntry[];
  genreBreakdown: { genre: string; count: number }[];
  favoriteGenre: string | null;
  mostLikedReview: MostLikedReview | null;
  mostSavedVault: MostSavedVault | null;
}

export function useStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data: UserStats = await res.json();
        setStats(data);
      } catch (err) {
        setError("Could not load stats.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { stats, loading, error };
}