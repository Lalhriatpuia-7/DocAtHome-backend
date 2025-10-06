import express from "express";
import { getMyProfile, getCurrentUser } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// Get logged-in user's profile
router.get("/me", protect, getMyProfile);
router.get("/getCurrentUser", protect, getCurrentUser);

export default router;