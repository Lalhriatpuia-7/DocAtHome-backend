import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "nurse", "admin"],
      default: "patient",
    },
    speciality: { type: String }, // <-- Added field for doctors
    availability: [
      {
        date: { type: Date, required: true },
        slots: [{ type: String }], // e.g., ["09:00", "10:00", "14:30"]
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
