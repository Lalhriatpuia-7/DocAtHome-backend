import express from "express";
import {
  getDoctors,
  updateAvailability,
} from "../controllers/doctorController.js";
import { addAvailability } from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getDoctors);
router.put("/availability", protect, updateAvailability);
router.post("/availability", protect, addAvailability);


export default router;