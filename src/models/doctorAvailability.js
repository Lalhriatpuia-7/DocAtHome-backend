import mongoose from "mongoose";

const doctorAvailabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  slots: [
    {
      day: { type: Date }, // Legacy field for backward compatibility
      dayOfWeek: { type: Number }, // 0-6 (Sunday-Saturday)
      startTime: { type: String, required: true }, 
      endTime: { type: String, required: true },
      recurring: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  unavailableDates: [
    {
      date: { type: Date },
      reason: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  region: { type: String }, // e.g., "New York", "California"
  timeStamp: { type: Date, default: Date.now },
});

export default mongoose.model("DoctorAvailability", doctorAvailabilitySchema);