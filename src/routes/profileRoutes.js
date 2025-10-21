import express from "express";
import { getMyProfile,  verifyUserProfile , getCurrentUser, createProfile, updateProfile} from "../controllers/profileController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
const router = express.Router();

// Get logged-in user's profile
router.get("/me", protect, getMyProfile);
router.post("/create", protect,upload.single("displayPicture"), createProfile);
router.put("/update", protect, upload.single("displayPicture"), updateProfile);
router.post("/verify", protect, adminOnly, verifyUserProfile);
router.get("/current-user", protect, getCurrentUser);

export default router;