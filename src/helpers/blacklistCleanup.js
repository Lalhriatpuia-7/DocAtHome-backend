import cron from "node-cron";
import { Blacklist } from "../models/blacklist.js";
import logger from "../config/logger.js";

const cleanupBlacklistedTokens = async () => {
  try {
    const result = await Blacklist.deleteMany({});
    logger.info(`Cleaned up ${result.deletedCount} expired blacklisted tokens`);
  } catch (err) {
    logger.error(`Error during blacklist cleanup: ${err.message}`);
  }
};

// Schedule the cleanup to run daily at midnight
cron.schedule("0 0 * * *", () => {
  logger.info("Running daily blacklist cleanup task");
  cleanupBlacklistedTokens();
});
export default cleanupBlacklistedTokens;
