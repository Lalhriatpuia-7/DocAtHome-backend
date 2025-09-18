import express from "express";
import {
  createAppointment,
  updateAppointmentStatus,
  getJitsiLink,
  getNextJitsiLink,
  getLatestJitsiLink,
  getAvailableTimeSlots,
  webHookPayment,
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only patients can create appointments
router.post("/", protect, createAppointment);

// Doctors/Nurses/Admins can update appointment status
router.patch("/:id/status", protect, updateAppointmentStatus);

// Get Jitsi link for an appointment
router.get("/:id/jitsi", protect, getJitsiLink);

// Get next Jitsi link for patient's appointment
router.get("/my/next-jitsi", protect, getNextJitsiLink);

// Get latest Jitsi link for patient's appointment
router.get("/my/latest-jitsi", protect, getLatestJitsiLink);

// Get available time slots for appointments
router.get("/available-timeslots", protect, getAvailableTimeSlots);

// Verify Razorpay payment webhook
router.post("/verify-payment", express.raw({ type: 'application/json' }), webHookPayment);

export default router;
