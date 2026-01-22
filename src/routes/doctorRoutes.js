import express from "express";
import {
  getDoctors,
  updateAvailability,
} from "../controllers/doctorController.js";
import { addAvailability } from "../controllers/doctorController.js";
import { getDoctorAvailability } from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { addRecuringAvailability } from "../controllers/doctorController.js";

const router = express.Router();

router.get("/", getDoctors);
router.get("/availability/",protect, getDoctorAvailability);
router.put("/availability", protect, updateAvailability);
router.post("/availability", protect, addAvailability);
router.post("/recurring-availability", protect, addRecuringAvailability);


export default router;