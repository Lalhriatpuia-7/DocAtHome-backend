/**
 * Utility functions for calculating recurring availability dates
 */

/**
 * Get the day of week from either old format (Date) or new format (Number)
 * @param {Date|Number|String} day - The day as Date, number (0-6), or string (day name)
 * @returns {Number} - Day of week (0-6, Sunday-Saturday)
 */
const getDayOfWeek = (day) => {
  if (typeof day === 'number') {
    return day;
  }
  if (typeof day === 'string') {
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    return dayMap[day.toLowerCase()] || 0;
  }
  if (day instanceof Date) {
    return day.getDay();
  }
  return 0;
};

/**
 * Convert day of week number to day name
 * @param {Number} dayOfWeek - Day of week (0-6, Sunday-Saturday)
 * @returns {String} - Day name (e.g., "Monday", "Tuesday")
 */
export const getDayName = (dayOfWeek) => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[dayOfWeek] || 'Unknown';
};

/**
 * Calculate recurring availability dates for a given date range
 * @param {Array} slots - Array of slot patterns with dayOfWeek/day, startTime, endTime
 * @param {Date} startDate - Start date for calculation (default: start of current month)
 * @param {Date} endDate - End date for calculation (default: end of current month)
 * @returns {Array} - Array of calculated slots with actual dates
 */
export const calculateRecurringAvailability = (slots, startDate = null, endDate = null) => {
  const calculatedSlots = [];
  
  // Default to current month if dates not provided
  if (!startDate) {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (!endDate) {
    const now = new Date();
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
  }
  
  // Ensure dates are at midnight for consistent comparison
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  // Iterate through each day in the date range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Find all slots that match this day of week
    slots.forEach(slot => {
      if (slot.recurring === false) {
        return; // Skip non-recurring slots
      }
      
      const slotDayOfWeek = slot.dayOfWeek !== undefined ? slot.dayOfWeek : getDayOfWeek(slot.day);
      
      if (slotDayOfWeek === dayOfWeek) {
        calculatedSlots.push({
          day: new Date(currentDate),
          dayOfWeek: slotDayOfWeek,
          dayName: getDayName(slotDayOfWeek),
          startTime: slot.startTime,
          endTime: slot.endTime,
          recurring: slot.recurring !== false,
          _id: slot._id // Include slot ID if available
        });
      }
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return calculatedSlots;
};

/**
 * Calculate recurring availability for current month only
 * @param {Array} slots - Array of slot patterns
 * @returns {Array} - Array of calculated slots for current month
 */
export const getCurrentMonthAvailability = (slots) => {
  return calculateRecurringAvailability(slots);
};

/**
 * Calculate recurring availability for next N days
 * @param {Array} slots - Array of slot patterns
 * @param {Number} days - Number of days to calculate (default: 90)
 * @returns {Array} - Array of calculated slots
 */
export const getUpcomingAvailability = (slots, days = 90) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  
  return calculateRecurringAvailability(slots, today, endDate);
};

/**
 * Get availability for a specific date range
 * @param {Array} slots - Array of slot patterns
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Array of calculated slots
 */
export const getAvailabilityByDateRange = (slots, startDate, endDate) => {
  return calculateRecurringAvailability(slots, startDate, endDate);
};

/**
 * Get availability for a specific date
 * @param {Array} slots - Array of slot patterns
 * @param {Date} date - The date to get availability for
 * @returns {Array} - Array of calculated slots for that date
 */
export const getAvailabilityForDate = (slots, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return calculateRecurringAvailability(slots, startOfDay, endOfDay);
};

/**
 * Migrate old slot format (with day field) to new format (with dayOfWeek field)
 * @param {Array} slots - Array of slots to migrate
 * @returns {Array} - Migrated slots
 */
export const migrateSlots = (slots) => {
  return slots.map(slot => ({
    ...slot,
    dayOfWeek: slot.dayOfWeek !== undefined ? slot.dayOfWeek : getDayOfWeek(slot.day)
  }));
};

export default {
  calculateRecurringAvailability,
  getCurrentMonthAvailability,
  getUpcomingAvailability,
  getAvailabilityByDateRange,
  getAvailabilityForDate,
  migrateSlots,
  getDayOfWeek,
  getDayName
};
