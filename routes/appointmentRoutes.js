import express from "express";
import {
  createAppointment,
  getMyAppointments,
  getProfessionalAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Only patients can create appointments
router.post("/", protect, authorizeRoles("patient"), createAppointment);

// Patients get their own appointments
router.get("/my", protect, authorizeRoles("patient"), getMyAppointments);

// Doctors/Nurses get their assigned appointments
router.get(
  "/professional",
  protect,
  authorizeRoles("doctor", "nurse"),
  getProfessionalAppointments
);

// Doctors/Nurses/Admins can update appointment status
router.put(
  "/:id/status",
  protect,
  authorizeRoles("doctor", "nurse", "admin"),
  updateAppointmentStatus
);

export default router;
