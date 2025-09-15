import express from "express";
import {
  getDoctors,
  updateAvailability,
} from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getDoctors);
router.put("/availability", protect, updateAvailability);

export default router;
