import { Schema, model } from "mongoose";

const hofCacheSchema = new Schema({
  topMeta:   { type: Array, required: true },
  popular:   { type: Array, required: true },
  genres:    { type: Array, required: true },
  fanFaves:  { type: Array, required: true },
  cachedAt:  { type: Date, required: true, default: Date.now },
});

export const HofCache = model("HofCache", hofCacheSchema);