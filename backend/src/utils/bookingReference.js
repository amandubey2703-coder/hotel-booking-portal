const crypto = require('crypto');

/**
 * Generates a customer-friendly, collision-resistant unique booking reference.
 * Format: HB-YYYYMMDD-XXXXX (e.g. HB-20261112-A8F91)
 * 
 * @param {Date} [date=new Date()]
 * @returns {string} Unique Booking Reference
 */
function generateBookingReference(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;

  // Use crypto random bytes converted to unambiguous uppercase alphanumeric characters
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomBytes = crypto.randomBytes(5);
  let randomSegment = '';
  for (let i = 0; i < 5; i++) {
    randomSegment += chars[randomBytes[i] % chars.length];
  }

  return `HB-${dateSegment}-${randomSegment}`;
}

module.exports = {
  generateBookingReference,
};

