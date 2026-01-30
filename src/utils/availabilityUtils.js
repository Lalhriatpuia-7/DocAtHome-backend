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
    return day.getUTCDay();
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
export const calculateRecurringAvailability = (slots, startDate = null, endDate = null, excludedDates = []) => {
  const calculatedSlots = [];
    const slotMap = new Map(); // Track unique date+time combinations to avoid duplicates
  
  // Default to current month if dates not provided
  if (!startDate) {
    const now = new Date();
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  if (!endDate) {
    const now = new Date();
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  }
  
  // Ensure dates are at midnight UTC for consistent comparison
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);
  
  // Iterate through each day in the date range
  const currentDate = new Date(startDate);
  
  // Normalize excluded dates into a set of keys for fast lookup (YYYY-MM-DD in UTC)
  const formatDateKey = (d) => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const excludedSet = new Set((excludedDates || []).map(d => {
    const dd = d instanceof Date ? d : new Date(d);
    dd.setUTCHours(0, 0, 0, 0);
    return formatDateKey(dd);
  }));
  
  while (currentDate <= endDate) {
    // Get the UTC day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = currentDate.getUTCDay();
    const currentKey = formatDateKey(currentDate);
    
    // Skip this entire day if it's excluded
    if (excludedSet.has(currentKey)) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      continue;
    }
    
    // Find all slots that match this day of week
    slots.forEach(slot => {
      if (slot.recurring === false) {
        return; // Skip non-recurring slots
      }
      
      const slotDayOfWeek = slot.dayOfWeek !== undefined ? slot.dayOfWeek : getDayOfWeek(slot.day);
      
        // Only add this slot if its dayOfWeek exactly matches the current date's day of week (in UTC)
      if (slotDayOfWeek === dayOfWeek) {
          // Create a unique key to prevent duplicates: date + time
          const uniqueKey = `${currentKey}|${slot.startTime}|${slot.endTime}`;
        
          // Only add if we haven't already added this exact slot for this date
          if (!slotMap.has(uniqueKey)) {
            slotMap.set(uniqueKey, true);
            calculatedSlots.push({
              day: new Date(currentDate),
              dayOfWeek: dayOfWeek,
              dayName: getDayName(dayOfWeek),
              startTime: slot.startTime,
              endTime: slot.endTime,
              recurring: slot.recurring !== false,
              _id: slot._id // Include slot ID if available
            });
          }
      }
    });
    
    // Move to next day in UTC
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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
export const getUpcomingAvailability = (slots, days = 90, excludedDates = []) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days);

  return calculateRecurringAvailability(slots, start, end, excludedDates);
};

/**
 * Get availability for a specific date range
 * @param {Array} slots - Array of slot patterns
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Array of calculated slots
 */
export const getAvailabilityByDateRange = (slots, startDate, endDate, excludedDates = []) => {
  if (!startDate || !endDate) return [];
  const s = new Date(startDate);
  const e = new Date(endDate);
  s.setUTCHours(0, 0, 0, 0);
  e.setUTCHours(23, 59, 59, 999);
  return calculateRecurringAvailability(slots, s, e, excludedDates);
};

/**
 * Get availability for a specific date
 * @param {Array} slots - Array of slot patterns
 * @param {Date} date - The date to get availability for
 * @returns {Array} - Array of calculated slots for that date
 */
export const getAvailabilityForDate = (slots, date, excludedDates = []) => {
  const d = new Date(date);
  const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return calculateRecurringAvailability(slots, startOfDay, endOfDay, excludedDates);
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
