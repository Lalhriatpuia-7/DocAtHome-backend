import mongoose from "mongoose";
const blacklistSchema = new mongoose.Schema({
  token: { type: String, required: true },
  blacklistedAt: { type: Date, default: Date.now, expires: '7d' } // Token expires after 7 days
});

export const Blacklist = mongoose.model("Blacklist", blacklistSchema);