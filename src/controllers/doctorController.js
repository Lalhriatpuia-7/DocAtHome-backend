import User from "../models/user.js";
import DoctorAvailability from "../models/doctorAvailability.js";
import logger from "../utils/logger.js";

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

export const getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.user.id;
    console.log("Fetching availability for doctor ID:", doctorId);  
    let availability = await DoctorAvailability.findOne({ doctor: doctorId });
    console.log("Retrieved availability:", availability);

    if(!availability || availability.slots.length === 0) {
      return res
        .status(404)
        .json({ message: "Availability not found for this doctor. Please Add Availability." });
    }
    
    // Convert old format (day field) to new format (dayOfWeek) if needed
    let needsSave = false;
    availability.slots.forEach((slot, index) => {
      if (slot.day && !slot.dayOfWeek) {
        slot.dayOfWeek = new Date(slot.day).getDay();
        needsSave = true;
      }
    });
    
    if (needsSave) {
      await availability.save();
      console.log("Migrated old slot format to new format");
    }
    
    // Calculate actual dates for the next 90 days from recurring patterns
    const calculatedSlots = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      const dayOfWeek = currentDate.getDay();
      
      // Find all slots that match this day of week
      availability.slots.forEach(slot => {
        const slotDayOfWeek = slot.dayOfWeek || (slot.day ? new Date(slot.day).getDay() : null);
        if (slotDayOfWeek === dayOfWeek && slot.recurring) {
          calculatedSlots.push({
            day: currentDate,
            dayOfWeek: slotDayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            recurring: slot.recurring
          });
        }
      });
    }
    
    res.json({ 
      doctor: availability.doctor,
      slots: calculatedSlots,
      pattern: availability.slots 
    });
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
    const { slots } = req.body; // slots: [{ day/dayOfWeek, startTime, endTime }, ...]

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: "Slots array is required." });
    }

    let availability = await DoctorAvailability.findOne({ doctor: doctorId });
    if (!availability) {
      availability = new DoctorAvailability({ doctor: doctorId, slots: [] });
    }

    const getDayOfWeek = (day) => {
      const dayMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      };
      if (typeof day === 'string') {
        return dayMap[day.toLowerCase()];
      }
      return day;
    };

    // Add new slot patterns, avoiding duplicates
    slots.forEach((newSlot) => {
      const dayOfWeek = getDayOfWeek(newSlot.day || newSlot.dayOfWeek);
      const exists = availability.slots.some(
        (slot) =>
          slot.dayOfWeek === dayOfWeek &&
          slot.startTime === newSlot.startTime &&
          slot.endTime === newSlot.endTime
      );
      if (!exists) {
        availability.slots.push({
          dayOfWeek: dayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          recurring: newSlot.recurring !== undefined ? newSlot.recurring : true,
        });
      }
    });

    await availability.save();
    res.json(availability);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addRecuringAvailability = async (req,res)=>{
  try{
    logger.info("Adding recurring availability. Full body: " + JSON.stringify(req.body));
    if (req.user.role !== "doctor") {
      logger.warn("Unauthorized attempt to add availability - user role: " + req.user.role);
      return res  
        .status(403)
        .json({ message: "Only doctors can add availability." });
    }
    const doctorId = req.user._id;
    logger.info("Doctor ID: " + doctorId);
    
    // Handle both formats: { slots: [...] } or direct array/object
    let slots = req.body.slots;
    if (!Array.isArray(slots)) {
      if (Array.isArray(req.body)) {
        slots = req.body;
      } else {
        slots = [req.body];
      }
    }

    logger.info("Processed slots: " + JSON.stringify(slots));
    
    if (!Array.isArray(slots) || slots.length === 0) {
      logger.warn("No valid slots provided for doctor: " + doctorId);
      return res.status(400).json({ message: "Slots array is required." });
    }
    
    // Helper function to convert day name to number
    const getDayOfWeek = (day) => {
      const dayMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6
      };
      if (typeof day === 'string') {
        return dayMap[day.toLowerCase()];
      }
      return day; // If already a number
    };
    
    let availability = await DoctorAvailability.findOne({ doctor: doctorId });
    if (!availability) {
      availability = new DoctorAvailability({ doctor: doctorId, slots: [] });
      logger.info("Created new availability document for doctor: " + doctorId);
    } 
    
    let addedCount = 0;
    
    // Add new recurring patterns, avoiding duplicates
    slots.forEach((newSlot) => {
      const targetDayOfWeek = getDayOfWeek(newSlot.day || newSlot.dayOfWeek);
      logger.info(`Processing recurring slot for day ${targetDayOfWeek} (${newSlot.day || newSlot.dayOfWeek}), time: ${newSlot.startTime}-${newSlot.endTime}`);
      
      // Check if this exact pattern already exists
      const exists = availability.slots.some(
        (slot) =>
          slot.dayOfWeek === targetDayOfWeek &&
          slot.startTime === newSlot.startTime &&
          slot.endTime === newSlot.endTime
      );
      
      if (!exists) {
        availability.slots.push({
          dayOfWeek: targetDayOfWeek,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          recurring: newSlot.recurring !== undefined ? newSlot.recurring : true,
        });
        addedCount++;
        logger.info(`Added recurring pattern for day ${targetDayOfWeek}`);
      } else {
        logger.info(`Pattern already exists for day ${targetDayOfWeek}`);
      }
    });
    
    logger.info(`Total patterns added: ${addedCount}, Total patterns now: ${availability.slots.length}`);
    await availability.save();
    logger.info("Availability saved successfully for doctor: " + doctorId);
    res.json(availability);
  }catch(err){
    logger.error("Error in addRecuringAvailability: " + err.message, { stack: err.stack });
    res.status(500).json({ message: err.message });
  }
  
}