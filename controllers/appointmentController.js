import crypto from "crypto";
import Appointment from "../models/appointment.js";
import DoctorAvailability from "../models/doctorAvailability.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

// Helper to generate a random Jitsi meeting link
function generateJitsiLink() {
  const randomId = crypto.randomBytes(16).toString("hex");
  logger.info(`Generated Jitsi link ID: ${randomId}`);
  return `https://meet.jit.si/DocAtHome-${randomId}`;
}

 function removeTimeslot(slots, date, timeSlot) {
  logger.info(`Removing timeslot: ${date} at ${timeSlot}`);
  return slots.filter(
    (slot) => !(slot.date.toISOString() === new Date(date).toISOString() && slot.timeSlot === timeSlot)
  );
}

const razorPay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

// Create appointment 
export const createAppointment = async (req, res) => {
  try {
    const { doctor, nurse, date, timeSlot, type, notes, fee } = req.body;

    const jitsiLink = generateJitsiLink();

    // Check if the time slot is available
    const availability = await DoctorAvailability.findOne({ doctor }); 
    logger.info(`Doctor availability fetched for doctor ID: ${doctor}`); 
    if (!availability) {
      logger.warn(`No availability found for doctor ID: ${doctor}`);
      return res.status(400).json({ message: "Doctor has no availability set." });
    } 
    const slotExists = availability.slots.some(
      (slot) =>
        slot.date.toISOString().slice(0, 10) === new Date(date).toISOString().slice(0, 10) && 
        slot.timeSlot === timeSlot
    );
    logger.info(`Slot existence check for date: ${date}, timeSlot: ${timeSlot} - ${slotExists}`);
    if (!slotExists) {
      logger.warn(`Requested time slot not available for doctor ID: ${doctor} on ${date} at ${timeSlot}`);
      return res.status(400).json({ message: "Selected time slot is not available." });
    }

    

     const order = await razorPay.orders.create({
      amount: fee * 100, // paise
      currency: "INR",
      receipt: `apt_${Date.now()}`,
    });

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      nurse,
      date,
      timeSlot, // <-- add this
      type,
      fee,
      orderId: order.id, // Store Razorpay order ID
      notes,
      jitsiLink,
    });

    // Remove the booked slot from doctor's availability
    availability.slots = removeTimeslot(availability.slots, date, timeSlot);
    await availability.save();
    logger.info(`Appointment created with ID: ${appointment._id} for patient ID: ${req.user._id}`);
    logger.info(`Updated availability for doctor ID: ${doctor} after booking`);
    // TODO: Notify doctor (email, push, etc.)

    res.status(201).json(appointment);
  } catch (err) {
    logger.error(`Error creating appointment: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// export const verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;    
//     const appointment = await Appointment.findOne({ orderId: razorpay_order_id });
//     if (!appointment) {
//       return res.status(404).json({ message: "Appointment not found" });
//     }
//     const generated_signature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(razorpay_order_id + "|" + razorpay_payment_id)
//       .digest("hex");
//     if (generated_signature !== razorpay_signature) {
//       return res.status(400).json({ message: "Invalid payment signature" });
//     } 
//     appointment.paymentId = razorpay_payment_id;
//     appointment.status = "confirmed";
//     await appointment.save();
//     res.json({ message: "Payment verified and appointment confirmed", appointment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   } 
// };

export const webHookPayment = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const shasum = crypto.createHmac("sha256", secret); 
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");  
      logger.info(`Razorpay webhook received with event: ${req.body.event}`);
    if (digest !== req.headers["x-razorpay-signature"]) {
      logger.warn("Invalid Razorpay webhook signature");
      return res.status(400).json({ message: "Invalid signature" });
    }
    const event = req.body.event;
    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const appointment = await Appointment.findOne({ orderId: payment.order_id });
      logger.info(`Payment captured for order ID: ${payment.order_id}`);
      logger.info(`Appointment fetched for payment verification: ${appointment ? appointment._id : 'Not Found'}`);
      if (appointment) {
        logger.info(`Verifying payment for appointment ID: ${appointment._id}`);
        appointment.paymentId = payment.id;
        appointment.status = "confirmed";
        await appointment.save();
        logger.info(`Appointment ID: ${appointment._id} confirmed after payment`);
      }
    }
    logger.info("Razorpay webhook processed successfully");
    res.json({ status: "ok" });
  } catch (err) {
    logger.error(`Error processing Razorpay webhook: ${err.message}`);
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
    logger.info(`Fetched appointments for patient ID: ${req.user._id}`);
    logger.info(`Total appointments found: ${appointments.length}`);
  } catch (err) {
    logger.error(`Error fetching appointments for patient ID: ${req.user._id} - ${err.message}`);
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
    logger.info(`Fetched appointments for ${role} ID: ${req.user._id}`);
    logger.info(`Total appointments found: ${appointments.length}`);

  } catch (err) {
    logger.error(`Error fetching appointments for professional ID: ${req.user._id} - ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    logger.info(`Updating status for appointment ID: ${req.params.id} to ${status}`);

    if (!appointment){
      logger.warn(`Appointment not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      logger.warn(`Invalid status update attempt: ${status}`);
      return res.status(400).json({ message: "Invalid status" });
    }

    appointment.status = status || appointment.status;
    await appointment.save();
    logger.info(`Appointment ID: ${appointment._id} status updated to ${appointment.status}`);  
    logger.info(`Notifying patient ID: ${appointment.patient} about status change`);
    res.json(appointment);
  } catch (err) {
    logger.error(`Error updating appointment status: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Get Jitsi link for an appointment
export const getJitsiLink = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    logger.info(`Fetching Jitsi link for appointment ID: ${req.params.id}`);

    if (!appointment){
      logger.warn(`Appointment not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (!appointment.jitsiLink){
      logger.warn(`Jitsi link not found for appointment ID: ${req.params.id}`);
      return res.status(404).json({ message: "Jitsi link not found" });
    }
    logger.info(`Jitsi link retrieved for appointment ID: ${appointment._id}`);
    
    res.json({ jitsiLink: appointment.jitsiLink });

  } catch (err) {
    logger.error(`Error fetching Jitsi link for appointment ID: ${req.params.id} - ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Get Jitsi link for the next upcoming appointment for the patient
export const getNextJitsiLink = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      patient: req.user._id,
      date: { $gte: new Date() },
    }).sort({ date: 1 });
    logger.info(`Fetching next Jitsi link for patient ID: ${req.user._id}`);
    if (!appointment){
      logger.warn(`No upcoming appointment found for patient ID: ${req.user._id}`);
      return res.status(404).json({ message: "No upcoming appointment found" });
    }
    if (!appointment.jitsiLink){
      logger.warn(`Jitsi link not found for appointment ID: ${appointment._id}`);
      return res.status(404).json({ message: "Jitsi link not found" });
    }
    logger.info(`Next Jitsi link retrieved for appointment ID: ${appointment._id}`);
    res.json({ jitsiLink: appointment.jitsiLink });
  } catch (err) {
    logger.error(`Error fetching next Jitsi link for patient ID: ${req.user._id} - ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Get Jitsi link for the latest appointment for the patient
export const getLatestJitsiLink = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      patient: req.user._id,
    }).sort({ createdAt: -1 }); // Sort by latest created
    logger.info(`Fetching latest Jitsi link for patient ID: ${req.user._id}`);
    if (!appointment){
      logger.warn(`No appointment found for patient ID: ${req.user._id}`);
      return res.status(404).json({ message: "No appointment found" });
    }
    if (!appointment.jitsiLink){
      logger.warn(`Jitsi link not found for appointment ID: ${appointment._id}`);
      return res.status(404).json({ message: "Jitsi link not found" });
    }
    logger.info(`Latest Jitsi link retrieved for appointment ID: ${appointment._id}`);
    res.json({ jitsiLink: appointment.jitsiLink });
  } catch (err) {
    logger.error(`Error fetching latest Jitsi link for patient ID: ${req.user._id} - ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Get available time slots for a doctor on a specific date
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.body; // Get from body instead of query
    logger.info(`Fetching available time slots for doctor ID: ${doctorId} on date: ${date}`);
    if (!doctorId || !date) {
      logger.warn("doctorId or date not provided for fetching available time slots");
      return res.status(400).json({ message: "doctorId and date are required" });
    }

    // Get doctor's available slots for the date
    const availability = await DoctorAvailability.findOne({ doctor: doctorId });
      logger.info(`Doctor availability fetched for doctor ID: ${doctorId}`);
    if (!availability){ 
      logger.warn(`No availability found for doctor ID: ${doctorId}`);
      return res.json({ availableSlots: [] });
    }
    // Filter slots for the requested date
    const slotsForDate = availability.slots
      .filter(slot => slot.date.toISOString().slice(0, 10) === new Date(date).toISOString().slice(0, 10))
      .map(slot => slot.timeSlot);
    logger.info(`Total slots found for date ${date}: ${slotsForDate.length}`);

    if (slotsForDate.length === 0) {
      logger.warn(`No slots available for doctor ID: ${doctorId} on date: ${date}`);
      return res.json({ availableSlots: [] });
    }
    logger.info(`Slots for date ${date}: ${slotsForDate.join(", ")}`);
    // Find booked slots for the doctor on that date
    const appointments = await Appointment.find({
      doctor: doctorId,
      date: new Date(date)
    });

    logger.info(`Total appointments found for doctor ID: ${doctorId} on date ${date}: ${appointments.length}`);
    const bookedSlots = appointments.map(a => a.timeSlot);
    logger.info(`Booked slots for date ${date}: ${bookedSlots.join(", ")}`);
    // Exclude booked slots
    const availableSlots = slotsForDate.filter(slot => !bookedSlots.includes(slot));
    logger.info(`Available slots for date ${date}: ${availableSlots.join(", ")}`);

    res.json({ availableSlots });
  } catch (err) {
    logger.error(`Error fetching available time slots: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

