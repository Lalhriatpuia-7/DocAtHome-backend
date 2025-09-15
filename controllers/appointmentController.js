import Appointment from "../models/appointment.js";

// Create appointment
export const createAppointment = async (req, res) => {
  try {
    const { doctor, nurse, date, type, notes } = req.body;

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      nurse,
      date,
      type,
      notes,
    });

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get patient’s appointments
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate("doctor", "name email")
      .populate("nurse", "name email");
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get doctor/nurse appointments
export const getProfessionalAppointments = async (req, res) => {
  try {
    const role = req.user.role;

    let filter = {};
    if (role === "doctor") filter.doctor = req.user._id;
    if (role === "nurse") filter.nurse = req.user._id;

    const appointments = await Appointment.find(filter)
      .populate("patient", "name email")
      .populate("doctor", "name email")
      .populate("nurse", "name email");

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    appointment.status = status || appointment.status;
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
