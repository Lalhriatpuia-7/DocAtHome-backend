import User from "../models/user.js";

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
