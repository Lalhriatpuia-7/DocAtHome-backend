import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g., "10:00-10:30"
    type: {
      type: String,
      enum: ["in-person", "virtual", "video"],
      required: true,
    },
    fee: Number,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    orderId: String, // For payment tracking
    paymentId: String, // For payment tracking
    notes: { type: String },
    jitsiLink: { type: String }, // <-- Add this line
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
