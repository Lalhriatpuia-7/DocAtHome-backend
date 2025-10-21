import express from "express";
import {
  getNurses,
  updateAvailability,
} from "../controllers/nurseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getNurses);
router.put("/availability", protect, updateAvailability);

export default router;
