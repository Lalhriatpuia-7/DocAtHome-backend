import mongoose from "mongoose";

const patientRecordSchema = new mongoose.Schema(
  {
    patient: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
    age: { type: Number, required: true },
    contact: { type: String, required: true }, // e.g., phone number
    address: { type: String, required: true },
    medicalHistory: { type: String },   // e.g., "Diabetes, Hypertension"
    allergies: { type: String },        // e.g., "Peanuts, Penicillin"
    bloodType: { type: String },      // e.g., "A+", "O-"
    medications: { type: String },      // e.g., "Metformin, Lisinopril"        
    emergencyContact: { type: String }, // e.g., "John Doe - 555-1234"
    notes: { type: String },            // Additional notes
   
  },
  { timestamps: true }
);

export default mongoose.model("PatientRecord", patientRecordSchema);