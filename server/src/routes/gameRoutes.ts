import { Router } from "express";
import { TrendingCache } from "../models/trendingCache.js";

const router = Router();
const RAWG_BASE = "https://rawg.io/api";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Search games
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query is required" });

  try {
    const response = await fetch(
      `${RAWG_BASE}/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(q as string)}&page_size=10`
    );
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ message: "Failed to fetch games" });
  }
});

// Trending games for home page — cached for 30 days
router.get("/trending", async (_req, res) => {
  try {
    const cached = await TrendingCache.findOne();
    const isFresh = cached && (Date.now() - new Date(cached.cachedAt).getTime() < THIRTY_DAYS_MS);

    if (isFresh) {
      return res.json({ results: cached.games });
    }

    // Cache is stale or empty — fetch fresh from RAWG
    const response = await fetch(
      `${RAWG_BASE}/games?key=${process.env.RAWG_API_KEY}&ordering=-trending&page_size=25`
    );
    const data = await response.json();
    const games = data.results ?? [];

    // Upsert — replace the single cache document
    if (cached) {
      await TrendingCache.findByIdAndUpdate(cached._id, { games, cachedAt: new Date() });
    } else {
      await TrendingCache.create({ games, cachedAt: new Date() });
    }

    res.json({ results: games });
  } catch {
    res.status(500).json({ message: "Failed to fetch trending games" });
  }
});

// Get single game by slug
router.get("/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const response = await fetch(
      `${RAWG_BASE}/games/${slug}?key=${process.env.RAWG_API_KEY}`
    );
    if (!response.ok) return res.status(404).json({ message: "Game not found" });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ message: "Failed to fetch game" });
  }
});

export default router;