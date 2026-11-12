/**
 * Date Utility Functions for Hotel Booking System
 * Handles date formatting, parsing, night calculations, and stay overlaps.
 */

/**
 * Validates whether a string matches YYYY-MM-DD format and is a valid calendar date.
 * @param {string} dateStr - Date string in format YYYY-MM-DD
 * @returns {boolean}
 */
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Returns today's date string in YYYY-MM-DD format based on local/server date.
 * @returns {string}
 */
function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a given date string is in the past (strictly before today).
 * Today's date is considered valid for check-in.
 * @param {string} dateStr - Date string in format YYYY-MM-DD
 * @returns {boolean}
 */
function isPastDate(dateStr) {
  const today = getTodayString();
  return dateStr < today;
}

/**
 * Calculates the number of nights between check-in and check-out.
 * Formula: (checkOutDate - checkInDate) in days.
 * @param {string} checkInStr - Format YYYY-MM-DD
 * @param {string} checkOutStr - Format YYYY-MM-DD
 * @returns {number}
 */
function calculateNights(checkInStr, checkOutStr) {
  const [inY, inM, inD] = checkInStr.split('-').map(Number);
  const [outY, outM, outD] = checkOutStr.split('-').map(Number);

  const checkIn = Date.UTC(inY, inM - 1, inD);
  const checkOut = Date.UTC(outY, outM - 1, outD);

  const diffMs = checkOut - checkIn;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Adds or subtracts days to a YYYY-MM-DD date string.
 * @param {string} dateStr 
 * @param {number} days 
 * @returns {string}
 */
function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const resYear = date.getUTCFullYear();
  const resMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const resDay = String(date.getUTCDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Standard overlap condition defined in assignment:
 * existing_check_in < requested_check_out AND existing_check_out > requested_check_in
 * @param {string} startA 
 * @param {string} endA 
 * @param {string} startB 
 * @param {string} endB 
 * @returns {boolean}
 */
function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Calculates peak nightly room occupancy across a requested stay period.
 * For each night in [checkIn, checkOut), counts confirmed bookings covering that night.
 * @param {Array<{check_in_date: string, check_out_date: string}>} bookings 
 * @param {string} checkInStr 
 * @param {string} checkOutStr 
 * @returns {number} Peak number of rooms occupied on any single night in the period.
 */
function calculatePeakNightlyOccupancy(bookings, checkInStr, checkOutStr) {
  if (!bookings || bookings.length === 0) return 0;

  const nights = calculateNights(checkInStr, checkOutStr);
  if (nights <= 0) return 0;

  let peakOccupancy = 0;

  for (let i = 0; i < nights; i++) {
    const currentNight = addDays(checkInStr, i);
    let nightOccupancy = 0;

    for (const b of bookings) {
      const bIn = typeof b.check_in_date === 'string' 
        ? b.check_in_date.substring(0, 10) 
        : b.check_in_date.toISOString().substring(0, 10);
      const bOut = typeof b.check_out_date === 'string' 
        ? b.check_out_date.substring(0, 10) 
        : b.check_out_date.toISOString().substring(0, 10);

      // A booking occupies currentNight if bIn <= currentNight and bOut > currentNight
      if (bIn <= currentNight && bOut > currentNight) {
        nightOccupancy++;
      }
    }

    if (nightOccupancy > peakOccupancy) {
      peakOccupancy = nightOccupancy;
    }
  }

  return peakOccupancy;
}

module.exports = {
  isValidDateString,
  getTodayString,
  isPastDate,
  calculateNights,
  addDays,
  datesOverlap,
  calculatePeakNightlyOccupancy,
};
