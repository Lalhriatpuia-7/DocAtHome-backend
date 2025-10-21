import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import appointmentRoutes from "./src/routes/appointmentRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import doctorRoutes from "./src/routes/doctorRoutes.js";
import nurseRoutes from "./src/routes/nurseRoutes.js";
import path from "path";
import patientRecordRoutes from "./src/routes/patientRecordsRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";


dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/patient-records", patientRecordRoutes);
app.use("/api/profile", profileRoutes);
// In your Express server setup

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));




app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
