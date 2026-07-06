import { Router, Request, Response } from "express";
import { UpcomingCache } from "../models/upcomingCache.js";

const router = Router();

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE = "https://api.rawg.io/api";

// Returns YYYY-MM-DD for a date offset by `days` from today
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    // 1. Check cache first
    const cached = await UpcomingCache.findOne().sort({ cachedAt: -1 });
    if (cached) {
      const age = Date.now() - new Date(cached.cachedAt).getTime();
      if (age < CACHE_TTL_MS) {
        return res.json({ games: cached.games, fromCache: true });
      }
    }

    // 2. Cache is stale or missing — make ONE RAWG API call
    if (!RAWG_API_KEY) {
      throw new Error("RAWG_API_KEY not set");
    }

    const today = offsetDate(0);
    const future = offsetDate(365); // next 12 months

    const url = `${RAWG_BASE}/games?key=${RAWG_API_KEY}&dates=${today},${future}&ordering=-added&page_size=40`;
    const rawgRes = await fetch(url);
    if (!rawgRes.ok) throw new Error(`RAWG error: ${rawgRes.statusText}`);

    const rawgData = await rawgRes.json();
    const games = rawgData.results ?? [];

    // 3. Save to cache (replace old document)
    await UpcomingCache.deleteMany({});
    await UpcomingCache.create({ games, cachedAt: new Date() });

    return res.json({ games, fromCache: false });
  } catch (err) {
    console.error("Upcoming games error:", err);
    return res.status(500).json({ error: "Cannot load upcoming games at this moment." });
  }
});

export default router;