const bookingService = require('../src/services/bookingService');
const hotelService = require('../src/services/hotelService');
const { pool } = require('../src/config/database');

describe('Simultaneous Booking Concurrency Protection', () => {
  beforeAll(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM bookings WHERE guest_email LIKE "%@concurrency-test.com";');
    } finally {
      connection.release();
    }
  });

  afterAll(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM bookings WHERE guest_email LIKE "%@concurrency-test.com";');
    } finally {
      connection.release();
    }
    await pool.end();
  });

  it('guarantees that when 2 users simultaneously attempt to book the last available room, exactly one succeeds and the other receives 409 Conflict', async () => {
    // Hotel 2 (Jaipur) has total_capacity = 4
    const hotelId = 2;
    const checkIn = '2026-11-15';
    const checkOut = '2026-11-17';

    // 1. Consume 3 rooms first so exactly 1 room remains available
    const initialAvail = await hotelService.getAvailability(hotelId, checkIn, checkOut);
    const roomsToFill = initialAvail.availableRooms - 1;

    for (let i = 0; i < roomsToFill; i++) {
      await bookingService.createBooking({
        hotelId,
        guestName: `Filler Guest ${i + 1}`,
        guestEmail: `filler${i + 1}@concurrency-test.com`,
        checkIn,
        checkOut,
      });
    }

    // Verify exactly 1 room remains available
    const beforeAvail = await hotelService.getAvailability(hotelId, checkIn, checkOut);
    expect(beforeAvail.availableRooms).toBe(1);

    // 2. Simulate User A and User B firing simultaneous booking requests at the exact same moment
    const bookingPromiseA = bookingService
      .createBooking({
        hotelId,
        guestName: 'User A',
        guestEmail: 'user.a@concurrency-test.com',
        checkIn,
        checkOut,
      })
      .then((res) => ({ status: 'resolved', result: res }))
      .catch((err) => ({ status: 'rejected', error: err }));

    const bookingPromiseB = bookingService
      .createBooking({
        hotelId,
        guestName: 'User B',
        guestEmail: 'user.b@concurrency-test.com',
        checkIn,
        checkOut,
      })
      .then((res) => ({ status: 'resolved', result: res }))
      .catch((err) => ({ status: 'rejected', error: err }));

    const [outcomeA, outcomeB] = await Promise.all([bookingPromiseA, bookingPromiseB]);

    // 3. Exactly one must have resolved, and exactly one must have been rejected
    const successfulCount = [outcomeA, outcomeB].filter((o) => o.status === 'resolved').length;
    const rejectedCount = [outcomeA, outcomeB].filter((o) => o.status === 'rejected').length;

    expect(successfulCount).toBe(1);
    expect(rejectedCount).toBe(1);

    // 4. The rejected request must have thrown 409 ROOM_UNAVAILABLE
    const failedOutcome = outcomeA.status === 'rejected' ? outcomeA : outcomeB;
    expect(failedOutcome.error.statusCode).toBe(409);
    expect(failedOutcome.error.code).toBe('ROOM_UNAVAILABLE');

    // 5. Final availability must be exactly 0
    const finalAvail = await hotelService.getAvailability(hotelId, checkIn, checkOut);
    expect(finalAvail.availableRooms).toBe(0);
  });
});
