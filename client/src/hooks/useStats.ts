import { useState, useEffect } from "react";
import { storage } from "../utils/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

export interface MonthEntry { key: string; label: string; count: number }
export interface YearEntry  { year: number; count: number }
export interface MostLikedReview {
  title: string; rating: number; review: string;
  likeCount: number; coverImage: string | null;
}
export interface MostSavedVault {
  title: string; saveCount: number;
  games: { coverImage: string | null }[];
}

export interface UserStats {
  totalLogged: number;
  completed: number;
  playing: number;
  dropped: number;
  averageRating: string | null;
  totalReviews: number;
  mostActiveMonth: string | null;
  mostActiveYear: number | null;
  favoriteGenre: string | null;
  highestRated: { title: string; rating: number; coverImage: string | null } | null;
  lowestRated:  { title: string; rating: number; coverImage: string | null } | null;
  activityByMonth: MonthEntry[];
  activityByYear: YearEntry[];
  ratingDistribution: { label: string; count: number }[];
  statusBreakdown: { Completed: number; Playing: number; Dropped: number };
  platformBreakdown: { platform: string; count: number }[];
  genreBreakdown: { genre: string; count: number }[];
  recentActivity: {
    _id: string; title: string; rating: number;
    status: string; platform: string;
    timestamp: string; coverImage: string | null;
  }[];
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
        const token = await storage.getToken();
        const res = await fetch(`${API_URL}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load stats");
        setStats(await res.json());
      } catch (e: any) {
        setError(e.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { stats, loading, error };
}