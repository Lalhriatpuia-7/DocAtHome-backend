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
    specialization: { type: String }, // <-- Added field for doctors
    // availability field removed
    lastLogin: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
