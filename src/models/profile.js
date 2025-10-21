import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    age: { type: Number },  // Age of the user
    displayPicture: { type: String }, // URL to profile picture
    address: { type: String }, // Address of the user
    phone: { type: String }, // Phone number
    bio: { type: String }, // Short bio or description
    // Additional fields can be added as needed
    verified: { type: Boolean, default: false }, // Verification status
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);