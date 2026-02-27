/**
 * Date utility functions for scheduling and time management
 */

/**
 * Get start and end of day
 */
const getStartOfDay = (date = new Date()) => {
   const d = new Date(date);
   d.setHours(0, 0, 0, 0);
   return d;
};

const getEndOfDay = (date = new Date()) => {
   const d = new Date(date);
   d.setHours(23, 59, 59, 999);
   return d;
};

/**
 * Get start and end of week
 */
const getStartOfWeek = (date = new Date()) => {
   const d = new Date(date);
   const day = d.getDay();
   const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
   d.setDate(diff);
   d.setHours(0, 0, 0, 0);
   return d;
};

const getEndOfWeek = (date = new Date()) => {
   const d = getStartOfWeek(date);
   d.setDate(d.getDate() + 6);
   d.setHours(23, 59, 59, 999);
   return d;
};

/**
 * Add days to a date
 */
const addDays = (date, days) => {
   const result = new Date(date);
   result.setDate(result.getDate() + days);
   return result;
};

/**
 * Add weeks to a date
 */
const addWeeks = (date, weeks) => {
   return addDays(date, weeks * 7);
};

/**
 * Check if date is in past
 */
const isPast = (date) => {
   return new Date(date) < new Date();
};

/**
 * Check if date is in future
 */
const isFuture = (date) => {
   return new Date(date) > new Date();
};

/**
 * Check if date is today
 */
const isToday = (date) => {
   const today = new Date();
   const checkDate = new Date(date);
   return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
   );
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
   const d = new Date(date);
   const year = d.getFullYear();
   const month = String(d.getMonth() + 1).padStart(2, '0');
   const day = String(d.getDate()).padStart(2, '0');
   return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM
 */
const formatTime = (date) => {
   const d = new Date(date);
   const hours = String(d.getHours()).padStart(2, '0');
   const minutes = String(d.getMinutes()).padStart(2, '0');
   return `${hours}:${minutes}`;
};

/**
 * Parse time string (HH:MM) to minutes
 */
const timeToMinutes = (timeString) => {
   const [hours, minutes] = timeString.split(':').map(Number);
   return hours * 60 + minutes;
};

/**
 * Convert minutes to time string (HH:MM)
 */
const minutesToTime = (minutes) => {
   const hours = Math.floor(minutes / 60);
   const mins = minutes % 60;
   return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Get day of week name
 */
const getDayName = (date) => {
   const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
   return days[new Date(date).getDay()];
};

/**
 * Get day of week number (0-6, Sunday = 0)
 */
const getDayNumber = (date) => {
   return new Date(date).getDay();
};

module.exports = {
   getStartOfDay,
   getEndOfDay,
   getStartOfWeek,
   getEndOfWeek,
   addDays,
   addWeeks,
   isPast,
   isFuture,
   isToday,
   formatDate,
   formatTime,
   timeToMinutes,
   minutesToTime,
   getDayName,
   getDayNumber
};
