const {
  isValidDateString,
  isPastDate,
  calculateNights,
  addDays,
  datesOverlap,
  calculatePeakNightlyOccupancy,
  getTodayString,
} = require('../src/utils/dateUtils');

describe('Date Utilities & Availability Logic', () => {
  describe('isValidDateString', () => {
    it('accepts valid YYYY-MM-DD date strings', () => {
      expect(isValidDateString('2026-12-10')).toBe(true);
      expect(isValidDateString('2027-01-01')).toBe(true);
      expect(isValidDateString('2026-02-28')).toBe(true);
    });

    it('rejects invalid format or nonexistent calendar dates', () => {
      expect(isValidDateString('2026-13-10')).toBe(false); // Invalid month 13
      expect(isValidDateString('2026-02-31')).toBe(false); // Feb 31 does not exist
      expect(isValidDateString('10-12-2026')).toBe(false); // Wrong order
      expect(isValidDateString('invalid-date')).toBe(false);
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
    });
  });

  describe('isPastDate', () => {
    it('allows today as valid check-in', () => {
      const today = getTodayString();
      expect(isPastDate(today)).toBe(false);
    });

    it('allows future dates', () => {
      expect(isPastDate('2099-01-01')).toBe(false);
    });

    it('rejects past dates', () => {
      expect(isPastDate('2020-01-01')).toBe(true);
      expect(isPastDate('2024-05-15')).toBe(true);
    });
  });

  describe('calculateNights', () => {
    it('calculates 3 nights for 10 Dec -> 13 Dec', () => {
      expect(calculateNights('2026-12-10', '2026-12-13')).toBe(3);
    });

    it('calculates 1 night for 10 Dec -> 11 Dec', () => {
      expect(calculateNights('2026-12-10', '2026-12-11')).toBe(1);
    });

    it('returns 0 or negative when check-out <= check-in', () => {
      expect(calculateNights('2026-12-10', '2026-12-10')).toBe(0);
      expect(calculateNights('2026-12-10', '2026-12-09')).toBe(-1);
    });
  });

  describe('addDays', () => {
    it('adds positive days correctly', () => {
      expect(addDays('2026-12-10', 3)).toBe('2026-12-13');
      expect(addDays('2026-12-30', 2)).toBe('2027-01-01');
    });

    it('subtracts days correctly', () => {
      expect(addDays('2026-12-10', -3)).toBe('2026-12-07');
    });
  });

  describe('datesOverlap condition', () => {
    // Condition: existing_check_in < requested_check_out AND existing_check_out > requested_check_in
    it('detects overlap when stay intervals overlap (10-15 vs 12-14)', () => {
      expect(datesOverlap('2026-06-10', '2026-06-15', '2026-06-12', '2026-06-14')).toBe(true);
    });

    it('detects overlap when existing encompasses requested stay', () => {
      expect(datesOverlap('2026-06-10', '2026-06-20', '2026-06-12', '2026-06-15')).toBe(true);
    });

    it('returns false when checkout matches checkin (no overlap: 10-15 vs 15-18)', () => {
      expect(datesOverlap('2026-06-10', '2026-06-15', '2026-06-15', '2026-06-18')).toBe(false);
    });

    it('returns false when stay is completely prior (no overlap: 10-15 vs 08-10)', () => {
      expect(datesOverlap('2026-06-10', '2026-06-15', '2026-06-08', '2026-06-10')).toBe(false);
    });
  });

  describe('calculatePeakNightlyOccupancy', () => {
    it('computes 0 occupancy when bookings array is empty', () => {
      expect(calculatePeakNightlyOccupancy([], '2026-12-10', '2026-12-13')).toBe(0);
    });

    it('computes peak occupancy for simultaneous overlapping stays', () => {
      const bookings = [
        { check_in_date: '2026-12-10', check_out_date: '2026-12-15' },
        { check_in_date: '2026-12-11', check_out_date: '2026-12-14' },
      ];
      // On night 10: 1 booking. On nights 11, 12, 13: 2 bookings.
      expect(calculatePeakNightlyOccupancy(bookings, '2026-12-10', '2026-12-15')).toBe(2);
    });

    it('handles back-to-back stays on the same day without false overlap', () => {
      const bookings = [
        { check_in_date: '2026-12-10', check_out_date: '2026-12-12' },
        { check_in_date: '2026-12-12', check_out_date: '2026-12-14' },
      ];
      // Checkout on 12th morning, next guest checkin on 12th afternoon
      // Night of 10th: 1 booking
      // Night of 11th: 1 booking
      // Night of 12th: 1 booking
      // Night of 13th: 1 booking
      // Peak nightly occupancy is 1 room!
      expect(calculatePeakNightlyOccupancy(bookings, '2026-12-10', '2026-12-14')).toBe(1);
    });
  });
});

