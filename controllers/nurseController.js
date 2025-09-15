import User from "../models/user.js";

export const getNurses = async (req, res) => {
  try {
    const nurses = await User.find({ role: "nurse" }).select(
      "name speciality availability"
    );
    res.json(nurses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    if (req.user.role !== "nurse") {
      return res.status(403).json({ message: "Access denied. Nurses only." });
    }
    const { availability } = req.body;
    const updatedNurse = await User.findByIdAndUpdate(
      req.user._id,
      { availability },
      { new: true }
    ).select("name speciality availability");
    res.json(updatedNurse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
