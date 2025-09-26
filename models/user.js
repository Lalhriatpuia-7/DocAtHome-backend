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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
