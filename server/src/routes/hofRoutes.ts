import { Router, Request, Response } from "express";
import { HofCache } from "../models/hofCache.js";

const router = Router();

const RAWG_BASE = "https://rawg.io/api";
const HOF_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

router.get("/", async (_req: Request, res: Response) => {
  const key = process.env.RAWG_API_KEY;

  try {
    // 1. Check cache first
    const cached = await HofCache.findOne().sort({ cachedAt: -1 });
    if (cached) {
      const age = Date.now() - new Date(cached.cachedAt).getTime();
      if (age < HOF_CACHE_TTL_MS) {
        return res.json({
          topMeta:  cached.topMeta,
          popular:  cached.popular,
          genres:   cached.genres,
          fanFaves: cached.fanFaves,
          fromCache: true,
        });
      }
    }

    // 2. Cache stale or missing — make 4 RAWG calls
    const [mc, pop, gen, fan] = await Promise.all([
      fetch(`${RAWG_BASE}/games?key=${key}&ordering=-metacritic&metacritic=70,100&page_size=10`).then(r => r.json()),
      fetch(`${RAWG_BASE}/games?key=${key}&ordering=-added&page_size=10`).then(r => r.json()),
      fetch(`${RAWG_BASE}/genres?key=${key}&ordering=-games_count&page_size=10`).then(r => r.json()),
      fetch(`${RAWG_BASE}/games?key=${key}&ordering=-rating&page_size=10`).then(r => r.json()),
    ]);

    const topMeta  = mc.results  ?? [];
    const popular  = pop.results ?? [];
    const genres   = gen.results ?? [];
    const fanFaves = fan.results ?? [];

    // 3. Save to cache (replace old document)
    await HofCache.deleteMany({});
    await HofCache.create({ topMeta, popular, genres, fanFaves, cachedAt: new Date() });

    return res.json({ topMeta, popular, genres, fanFaves, fromCache: false });
  } catch {
    res.status(500).json({ message: "Cannot load Hall of Fame at this moment." });
  }
});

export default router;