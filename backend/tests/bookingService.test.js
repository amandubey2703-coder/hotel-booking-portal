const bookingService = require('../src/services/bookingService');
const hotelService = require('../src/services/hotelService');
const { pool } = require('../src/config/database');
const { generateBookingReference } = require('../src/utils/bookingReference');

describe('Booking Service Business Logic', () => {
  beforeAll(async () => {
    // Reset test data in hotel_booking before test suite
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM bookings WHERE guest_email LIKE "%@test-suite.com";');
    } finally {
      connection.release();
    }
  });

  afterAll(async () => {
    // Clean up test bookings and close pool
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM bookings WHERE guest_email LIKE "%@test-suite.com";');
    } finally {
      connection.release();
    }
    await pool.end();
  });

  describe('Unique Booking Reference Generation', () => {
    it('generates references matching the required format HB-YYYYMMDD-XXXXX', () => {
      const ref = generateBookingReference();
      expect(ref).toMatch(/^HB-\d{8}-[2-9A-HJ-NP-Z]{5}$/);
    });

    it('generates unique references across multiple calls', () => {
      const refs = new Set();
      for (let i = 0; i < 100; i++) {
        refs.add(generateBookingReference());
      }
      expect(refs.size).toBe(100);
    });
  });

  describe('Booking Creation & Authoritative Backend Pricing', () => {
    it('calculates price independently on backend (5000 x 3 nights = 15000)', async () => {
      // Hotel 1 (Mumbai) has price 5000/night
      const booking = await bookingService.createBooking({
        hotelId: 1,
        guestName: 'Rajesh Sharma',
        guestEmail: 'rajesh@test-suite.com',
        checkIn: '2026-11-20',
        checkOut: '2026-11-23',
      });

      expect(booking).toBeDefined();
      expect(booking.bookingReference).toMatch(/^HB-/);
      expect(booking.numberOfNights).toBe(3);
      expect(booking.pricePerNight).toBe(5000);
      expect(booking.totalAmount).toBe(15000);
      expect(booking.status).toBe('CONFIRMED');
    });
  });

  describe('Booking Retrieval & Security Constraints', () => {
    let testRef;
    const testEmail = 'retrieval.user@test-suite.com';

    beforeAll(async () => {
      const booking = await bookingService.createBooking({
        hotelId: 2,
        guestName: 'Retrieval User',
        guestEmail: testEmail,
        checkIn: '2026-11-25',
        checkOut: '2026-11-27',
      });
      testRef = booking.bookingReference;
    });

    it('successfully retrieves booking with matching reference and email', async () => {
      const retrieved = await bookingService.getBooking(testRef, testEmail);
      expect(retrieved.bookingReference).toBe(testRef);
      expect(retrieved.guestEmail).toBe(testEmail);
      expect(retrieved.hotelName).toBe('The Royal Heritage Palace');
      expect(retrieved.numberOfNights).toBe(2);
      expect(retrieved.totalAmount).toBe(14400); // 7200 x 2
    });

    it('rejects retrieval when email does not match (Security Rule)', async () => {
      await expect(
        bookingService.getBooking(testRef, 'wrong.email@example.com')
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'BOOKING_EMAIL_MISMATCH',
      });
    });

    it('rejects retrieval for nonexistent booking reference', async () => {
      await expect(
        bookingService.getBooking('HB-99999999-XXXXX', testEmail)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'BOOKING_NOT_FOUND',
      });
    });
  });

  describe('Capacity Management, Overbooking & Cancellation Release', () => {
    // Hotel 5 (Manali) has total_capacity = 4
    const checkIn = '2026-11-15';
    const checkOut = '2026-11-18';
    const hotelId = 5;

    it('tracks availability reduction, prevents overbooking, and releases capacity upon cancellation', async () => {
      // 1. Check initial availability for Hotel 5
      const initialAvail = await hotelService.getAvailability(hotelId, checkIn, checkOut);
      const capacity = initialAvail.totalCapacity;
      expect(initialAvail.availableRooms).toBe(capacity);

      // 2. Book all available rooms to fully exhaust capacity
      const createdBookings = [];
      for (let i = 0; i < capacity; i++) {
        const b = await bookingService.createBooking({
          hotelId,
          guestName: `Guest ${i + 1}`,
          guestEmail: `guest${i + 1}@test-suite.com`,
          checkIn,
          checkOut,
        });
        createdBookings.push(b);
      }

      // 3. Verify availability is now 0 (Sold out)
      const zeroAvail = await hotelService.getAvailability(hotelId, checkIn, checkOut);
      expect(zeroAvail.availableRooms).toBe(0);
      expect(zeroAvail.isAvailable).toBe(false);

      // 4. Attempting to book one more room must fail with 409 ROOM_UNAVAILABLE
      await expect(
        bookingService.createBooking({
          hotelId,
          guestName: 'Overbooked Guest',
          guestEmail: 'overbooked@test-suite.com',
          checkIn,
          checkOut,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'ROOM_UNAVAILABLE',
      });

      // 5. Cancel one of the bookings
      const bookingToCancel = createdBookings[0];
      const cancelRes = await bookingService.cancelBooking(
        bookingToCancel.bookingReference,
        bookingToCancel.guestEmail
      );
      expect(cancelRes.success).toBe(true);
      expect(cancelRes.booking.status).toBe('CANCELLED');

      // 6. Verify capacity is immediately released: available is now 1!
      const releasedAvail = await hotelService.getAvailability(hotelId, checkIn, checkOut);
      expect(releasedAvail.availableRooms).toBe(1);
      expect(releasedAvail.isAvailable).toBe(true);

      // 7. Verify cancelling the same booking again fails with 400 BOOKING_ALREADY_CANCELLED
      await expect(
        bookingService.cancelBooking(
          bookingToCancel.bookingReference,
          bookingToCancel.guestEmail
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'BOOKING_ALREADY_CANCELLED',
      });
    });
  });
});
