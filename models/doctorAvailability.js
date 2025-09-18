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
      date: { type: Date, required: true },
      timeSlot: { type: String, required: true }, // e.g., "10:00-10:30"
    }
  ],
  region: { type: String }, // e.g., "New York", "California"
});

export default mongoose.model("DoctorAvailability", doctorAvailabilitySchema);