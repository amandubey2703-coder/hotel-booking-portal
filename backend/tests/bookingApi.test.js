const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

describe('REST API Integration Tests (Supertest)', () => {
  beforeAll(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM bookings WHERE guest_email LIKE "%@api-test.com";');
    } finally {
      connection.release();
    }
  });

  afterAll(async () => {
    const connection = await pool.getConnection();
    try {
      await connection.query('DELETE FROM bookings WHERE guest_email LIKE "%@api-test.com";');
    } finally {
      connection.release();
    }
    await pool.end();
  });

  describe('GET /api/health', () => {
    it('returns 200 OK and health confirmation', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is running');
    });
  });

  describe('GET /api/hotels', () => {
    it('returns all hotels with count >= 5', async () => {
      const res = await request(app).get('/api/hotels');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });

    it('filters hotels by location query (case-insensitive)', async () => {
      const res = await request(app).get('/api/hotels?location=goa');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].location).toBe('Goa');
    });

    it('returns empty array when no hotel matches location', async () => {
      const res = await request(app).get('/api/hotels?location=NonExistentCityXYZ');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('GET /api/hotels/:id', () => {
    it('returns 200 with hotel details for valid ID', async () => {
      const res = await request(app).get('/api/hotels/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Grand Horizon Hotel');
      expect(res.body.data.price_per_night).toBe(5000);
    });

    it('returns 404 for unknown hotel ID', async () => {
      const res = await request(app).get('/api/hotels/9999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('HOTEL_NOT_FOUND');
    });
  });

  describe('GET /api/hotels/:id/availability', () => {
    it('returns 200 with availability data for valid dates', async () => {
      const res = await request(app)
        .get('/api/hotels/1/availability?checkIn=2026-11-20&checkOut=2026-11-23');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.numberOfNights).toBe(3);
      expect(res.body.data.pricePerNight).toBe(5000);
      expect(res.body.data.totalAmount).toBe(15000);
      expect(typeof res.body.data.availableRooms).toBe('number');
    });

    it('rejects past check-in dates with 400 CHECK_IN_PAST', async () => {
      const res = await request(app)
        .get('/api/hotels/1/availability?checkIn=2020-01-01&checkOut=2020-01-05');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CHECK_IN_PAST');
    });

    it('rejects checkOut <= checkIn with 400 INVALID_DATE_RANGE', async () => {
      const res = await request(app)
        .get('/api/hotels/1/availability?checkIn=2026-11-20&checkOut=2026-11-20');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
    });
  });

  describe('POST /api/bookings (Booking Creation & Backend Pricing)', () => {
    it('creates a booking successfully and independently computes total amount', async () => {
      const payload = {
        hotelId: 3, // Goa: 6500/night
        guestName: 'Neha Verma',
        guestEmail: 'neha@api-test.com',
        checkIn: '2026-11-22',
        checkOut: '2026-11-25', // 3 nights
        totalAmount: 1, // Attacking spoof attempt: backend must ignore this!
      };

      const res = await request(app).post('/api/bookings').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingReference).toMatch(/^HB-/);
      expect(res.body.data.numberOfNights).toBe(3);
      expect(res.body.data.pricePerNight).toBe(6500);
      expect(res.body.data.totalAmount).toBe(19500); // 6500 * 3 = 19500 (Ignored spoofed 1!)
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('rejects booking with invalid email format', async () => {
      const payload = {
        hotelId: 1,
        guestName: 'Bad Email User',
        guestEmail: 'not-an-email',
        checkIn: '2026-11-20',
        checkOut: '2026-11-22',
      };
      const res = await request(app).post('/api/bookings').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_EMAIL');
    });

    it('rejects booking with empty guest name', async () => {
      const payload = {
        hotelId: 1,
        guestName: '   ',
        guestEmail: 'valid@api-test.com',
        checkIn: '2026-11-20',
        checkOut: '2026-11-22',
      };
      const res = await request(app).post('/api/bookings').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_GUEST_NAME');
    });
  });

  describe('GET & POST/PATCH /api/bookings/:reference (Retrieve & Cancel)', () => {
    let bookingRef;
    const email = 'manage.user@api-test.com';

    beforeAll(async () => {
      const res = await request(app).post('/api/bookings').send({
        hotelId: 4, // Bengaluru
        guestName: 'Manage Test User',
        guestEmail: email,
        checkIn: '2026-11-28',
        checkOut: '2026-11-30',
      });
      bookingRef = res.body.data.bookingReference;
    });

    it('retrieves booking with valid reference and matching email', async () => {
      const res = await request(app).get(`/api/bookings/${bookingRef}?email=${email}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingReference).toBe(bookingRef);
      expect(res.body.data.hotelName).toBe('Silicon Valley Grand Hotel');
      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('forbids retrieval when email does not match', async () => {
      const res = await request(app).get(`/api/bookings/${bookingRef}?email=wrong@example.com`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('BOOKING_EMAIL_MISMATCH');
    });

    it('cancels booking with POST /cancel and matching email', async () => {
      const res = await request(app)
        .post(`/api/bookings/${bookingRef}/cancel`)
        .send({ email });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('rejects repeated cancellation with 400 BOOKING_ALREADY_CANCELLED', async () => {
      const res = await request(app)
        .post(`/api/bookings/${bookingRef}/cancel`)
        .send({ email });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BOOKING_ALREADY_CANCELLED');
    });
  });
});
