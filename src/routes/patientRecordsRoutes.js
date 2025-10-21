import express from "express";
import {
   createPatientRecord, getPatientRecords, editPatientRecord, deletePatientRecord 
} from "../controllers/patientRecordsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get records for a specific patient
router.get("/:patientId", protect, getPatientRecords);  
// Add a new record for a patient
router.post("/", protect, createPatientRecord);
router.put("/:recordId", protect, editPatientRecord);
router.delete("/:recordId", protect, deletePatientRecord);

export default router;