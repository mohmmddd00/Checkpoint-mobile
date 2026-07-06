import { Schema, model } from "mongoose";

const upcomingCacheSchema = new Schema({
  games: { type: Array, required: true },
  cachedAt: { type: Date, required: true, default: Date.now },
});

export const UpcomingCache = model("UpcomingCache", upcomingCacheSchema);