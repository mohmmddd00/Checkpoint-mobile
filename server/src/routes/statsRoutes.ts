import { Router, Response } from "express";
import { GameLog } from "../models/gameLog.js";
import { User } from "../models/user.js";
import { Vault } from "../models/vaults.js";
import { SavedVault } from "../models/savedVaults.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/stats
// Computes all user stats purely from the GameLog collection — no RAWG calls.
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userDoc = await User.findById(userId).select("gamesLogged");
    if (!userDoc) return res.status(404).json({ message: "User not found" });

    const logs = await GameLog.find({ _id: { $in: userDoc.gamesLogged } }).lean();

    if (logs.length === 0) {
      return res.json({
        totalLogged: 0,
        completed: 0,
        playing: 0,
        dropped: 0,
        averageRating: null,
        highestRated: null,
        lowestRated: null,
        totalReviews: 0,
        ratingDistribution: [],
        statusBreakdown: { Completed: 0, Playing: 0, Dropped: 0 },
        platformBreakdown: [],
        mostActiveMonth: null,
        mostActiveYear: null,
        activityByMonth: [],
        activityByYear: [],
        loggingStreak: 0,
        recentActivity: [],
      });
    }

    // ── Basic counts ──────────────────────────────────────────────────────────
    const totalLogged = logs.length;
    const completed = logs.filter((l) => l.status === "Completed").length;
    const playing = logs.filter((l) => l.status === "Playing").length;
    const dropped = logs.filter((l) => l.status === "Dropped").length;
    const totalReviews = logs.filter((l) => l.review && l.review.trim().length > 0).length;

    // ── Ratings ───────────────────────────────────────────────────────────────
    const ratedLogs = logs.filter((l) => l.rating != null);
    const averageRating =
      ratedLogs.length > 0
        ? parseFloat(
            (ratedLogs.reduce((s, l) => s + (l.rating as number), 0) / ratedLogs.length).toFixed(1)
          )
        : null;

    const sorted = [...ratedLogs].sort((a, b) => (b.rating as number) - (a.rating as number));
    const highestRated = sorted[0]
      ? { title: sorted[0].title, rating: sorted[0].rating, coverImage: sorted[0].coverImage }
      : null;
    const lowestRated = sorted[sorted.length - 1]
      ? {
          title: sorted[sorted.length - 1].title,
          rating: sorted[sorted.length - 1].rating,
          coverImage: sorted[sorted.length - 1].coverImage,
        }
      : null;

    // ── Rating distribution (0-1, 2-3, 4-5, 6-7, 8-9, 10) ───────────────────
    const buckets = [
      { label: "0–1",  min: 0,  max: 0.9 },
      { label: "1–2",  min: 1,  max: 1.9 },
      { label: "2–3",  min: 2,  max: 2.9 },
      { label: "3–4",  min: 3,  max: 3.9 },
      { label: "4–5",  min: 4,  max: 4.9 },
      { label: "5–6",  min: 5,  max: 5.9 },
      { label: "6–7",  min: 6,  max: 6.9 },
      { label: "7–8",  min: 7,  max: 7.9 },
      { label: "8–9",  min: 8,  max: 8.9 },
      { label: "9–10", min: 9,  max: 10  },
    ];
    const ratingDistribution = buckets.map((b) => ({
      label: b.label,
      count: ratedLogs.filter((l) => (l.rating as number) >= b.min && (l.rating as number) <= b.max).length,
    }));

    // ── Genre breakdown ───────────────────────────────────────────────────────
    const genreMap: Record<string, number> = {};
    logs.forEach((l) => {
      if (Array.isArray(l.genres)) {
        l.genres.forEach((g: string) => {
          if (g) genreMap[g] = (genreMap[g] || 0) + 1;
        });
      }
    });
    const genreBreakdown = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
    const favoriteGenre = genreBreakdown[0]?.genre ?? null;

    // ── Platform breakdown ────────────────────────────────────────────────────
    const platformMap: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.platform) platformMap[l.platform] = (platformMap[l.platform] || 0) + 1;
    });
    const platformBreakdown = Object.entries(platformMap)
      .sort((a, b) => b[1] - a[1])
      .map(([platform, count]) => ({ platform, count }));

    // ── Activity by month (last 12 months) ───────────────────────────────────
    const monthMap: Record<string, number> = {};
    logs.forEach((l) => {
      const d = new Date(l.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });

    // Build last 12 months in order
    const now = new Date();
    const last12: { label: string; key: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const shortMonth = d.toLocaleString("en-US", { month: "short" });
      last12.push({ label: `${shortMonth} '${String(d.getFullYear()).slice(2)}`, key, count: monthMap[key] || 0 });
    }

    // Most active month overall
    const peakMonthEntry = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0];
    let mostActiveMonth: string | null = null;
    if (peakMonthEntry) {
      const [yr, mo] = peakMonthEntry[0].split("-");
      const d = new Date(Number(yr), Number(mo) - 1, 1);
      mostActiveMonth = `${d.toLocaleString("en-US", { month: "long" })} ${yr}`;
    }

    // ── Activity by year ──────────────────────────────────────────────────────
    const yearMap: Record<string, number> = {};
    logs.forEach((l) => {
      const yr = new Date(l.timestamp).getFullYear().toString();
      yearMap[yr] = (yearMap[yr] || 0) + 1;
    });
    const activityByYear = Object.entries(yearMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => ({ year, count }));

    const peakYearEntry = Object.entries(yearMap).sort((a, b) => b[1] - a[1])[0];
    const mostActiveYear = peakYearEntry ? peakYearEntry[0] : null;

    // ── Status breakdown ──────────────────────────────────────────────────────
    const statusBreakdown = { Completed: completed, Playing: playing, Dropped: dropped };

    // ── Recent activity (last 8 logged) ──────────────────────────────────────
    const recentActivity = [...logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8)
      .map((l) => ({
        _id: l._id,
        title: l.title,
        platform: l.platform,
        status: l.status,
        rating: l.rating,
        coverImage: l.coverImage,
        timestamp: l.timestamp,
      }));

    // ── Most liked review ─────────────────────────────────────────────────────
    const reviewLogs = logs.filter((l) => l.review && l.review.trim().length > 0 && Array.isArray(l.likes) && l.likes.length > 0);
    const topReviewLog = reviewLogs.sort((a, b) => b.likes.length - a.likes.length)[0] ?? null;
    const mostLikedReview = topReviewLog
      ? {
          _id: topReviewLog._id,
          title: topReviewLog.title,
          review: topReviewLog.review,
          rating: topReviewLog.rating,
          coverImage: topReviewLog.coverImage,
          likeCount: topReviewLog.likes.length,
        }
      : null;

    // ── Most saved vault ──────────────────────────────────────────────────────
    const userVaults = await Vault.find({ user: userId }).lean();
    let mostSavedVault: {
      _id: string;
      title: string;
      games: { coverImage: string | null }[];
      saveCount: number;
    } | null = null;

    if (userVaults.length > 0) {
      const vaultIds = userVaults.map((v) => v._id);
      const saveCounts = await SavedVault.aggregate([
        { $match: { vault: { $in: vaultIds } } },
        { $group: { _id: "$vault", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]);

      if (saveCounts.length > 0 && saveCounts[0].count > 0) {
        const topVault = userVaults.find(
          (v) => v._id.toString() === saveCounts[0]._id.toString()
        );
        if (topVault) {
          mostSavedVault = {
            _id: topVault._id.toString(),
            title: topVault.title,
            games: topVault.games.slice(0, 4).map((g) => ({ coverImage: g.coverImage })),
            saveCount: saveCounts[0].count,
          };
        }
      }
    }

    return res.json({
      totalLogged,
      completed,
      playing,
      dropped,
      averageRating,
      highestRated,
      lowestRated,
      totalReviews,
      ratingDistribution,
      statusBreakdown,
      platformBreakdown,
      mostActiveMonth,
      mostActiveYear,
      activityByMonth: last12,
      activityByYear,
      recentActivity,
      genreBreakdown,
      favoriteGenre,
      mostLikedReview,
      mostSavedVault,
    });
  } catch (err) {
    console.error("Stats route error:", err);
    res.status(500).json({ message: "Failed to compute stats" });
  }
});

export default router;