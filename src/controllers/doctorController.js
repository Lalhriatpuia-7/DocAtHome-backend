import User from "../models/user.js";
import DoctorAvailability from "../models/doctorAvailability.js";

export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select(
      "name speciality availability"
    );
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied. Doctors only." });
    }
    const { availability } = req.body;
    const updatedDoctor = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true }
    ).select("name speciality availability");
    res.json(updatedDoctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add multiple availability slots for a doctor
export const addAvailability = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Only doctors can add availability." });
    }

    const doctorId = req.user._id;
    const { slots } = req.body; // slots: [{ date, timeSlot }, ...]

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: "Slots array is required." });
    }

    let availability = await DoctorAvailability.findOne({ doctor: doctorId });
    if (!availability) {
      availability = new DoctorAvailability({ doctor: doctorId, slots: [] });
    }

    // Add new slots, avoiding duplicates
    slots.forEach((newSlot) => {
      const exists = availability.slots.some(
        (slot) =>
          slot.date.toISOString() === new Date(newSlot.date).toISOString() &&
          slot.timeSlot === newSlot.timeSlot
      );
      if (!exists) {
        availability.slots.push({
          date: new Date(newSlot.date),
          timeSlot: newSlot.timeSlot,
        });
      }
    });

    await availability.save();
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
