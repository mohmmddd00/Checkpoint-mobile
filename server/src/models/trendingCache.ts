import { Schema, model } from "mongoose";

const trendingCacheSchema = new Schema({
  games: { type: Array, required: true },
  cachedAt: { type: Date, required: true, default: Date.now },
});

export const TrendingCache = model("TrendingCache", trendingCacheSchema);