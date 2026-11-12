const { pool } = require('../config/database');

class BookingRepository {
  /**
   * Retrieves all confirmed bookings that overlap with the requested date range.
   *
   * Overlap rule:
   *   existing check-in  < requested check-out
   *   AND
   *   existing check-out > requested check-in
   *
   * CANCELLED bookings are ignored.
   *
   * When called with a transaction connection, FOR UPDATE is used so the
   * booking rows read by the transaction are locked until commit/rollback.
   *
   * @param {number} hotelId
   * @param {number} roomTypeId
   * @param {string} checkIn
   * @param {string} checkOut
   * @param {Object} [connection=pool]
   * @returns {Promise<Array>}
   */
  async getOverlappingConfirmedBookings(
    hotelId,
    roomTypeId,
    checkIn,
    checkOut,
    connection = pool
  ) {
    let query = `
      SELECT
        id,
        booking_reference,
        check_in_date,
        check_out_date,
        status
      FROM bookings
      WHERE hotel_id = ?
        AND room_type_id = ?
        AND status = 'CONFIRMED'
        AND check_in_date < ?
        AND check_out_date > ?
      ORDER BY check_in_date ASC
    `;

    // Lock matching booking rows when running inside a transaction.
    if (connection !== pool) {
      query += ` FOR UPDATE`;
    }

    const [rows] = await connection.query(query, [
      hotelId,
      roomTypeId,
      checkOut,
      checkIn
    ]);

    return rows;
  }

  /**
   * Inserts a new booking.
   *
   * @param {Object} bookingData
   * @param {Object} [connection=pool]
   * @returns {Promise<number>}
   */
  async createBooking(bookingData, connection = pool) {
    const query = `
      INSERT INTO bookings (
        booking_reference,
        hotel_id,
        room_type_id,
        guest_name,
        guest_email,
        check_in_date,
        check_out_date,
        number_of_nights,
        price_per_night,
        total_amount,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      bookingData.bookingReference,
      bookingData.hotelId,
      bookingData.roomTypeId,
      bookingData.guestName,
      bookingData.guestEmail,
      bookingData.checkInDate,
      bookingData.checkOutDate,
      bookingData.numberOfNights,
      bookingData.pricePerNight,
      bookingData.totalAmount,
      bookingData.status || 'CONFIRMED'
    ];

    const [result] = await connection.query(query, values);

    return result.insertId;
  }

  /**
   * Finds a booking by booking reference.
   *
   * @param {string} reference
   * @param {Object} [connection=pool]
   * @returns {Promise<Object|null>}
   */
  async findByReference(reference, connection = pool) {
    const query = `
      SELECT
        b.id,
        b.booking_reference,
        b.hotel_id,
        b.room_type_id,
        b.guest_name,
        b.guest_email,
        b.check_in_date,
        b.check_out_date,
        b.number_of_nights,
        b.price_per_night,
        b.total_amount,
        b.status,
        b.created_at,
        b.updated_at,

        h.name AS hotel_name,
        h.location AS hotel_location,
        h.image_url AS hotel_image,

        r.name AS room_type_name
      FROM bookings b
      JOIN hotels h
        ON b.hotel_id = h.id
      JOIN room_types r
        ON b.room_type_id = r.id
      WHERE b.booking_reference = ?
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [reference]);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds a booking using both booking reference and email.
   *
   * Email comparison is case-insensitive.
   *
   * @param {string} reference
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByReferenceAndEmail(reference, email) {
    const query = `
      SELECT
        b.id,
        b.booking_reference,
        b.hotel_id,
        b.room_type_id,
        b.guest_name,
        b.guest_email,
        b.check_in_date,
        b.check_out_date,
        b.number_of_nights,
        b.price_per_night,
        b.total_amount,
        b.status,
        b.created_at,
        b.updated_at,

        h.name AS hotel_name,
        h.location AS hotel_location,
        h.image_url AS hotel_image,

        r.name AS room_type_name
      FROM bookings b
      JOIN hotels h
        ON b.hotel_id = h.id
      JOIN room_types r
        ON b.room_type_id = r.id
      WHERE b.booking_reference = ?
        AND LOWER(b.guest_email) = LOWER(?)
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [
      reference,
      email
    ]);

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Updates booking status.
   *
   * Used for cancellation.
   *
   * @param {string} reference
   * @param {string} status
   * @param {Object} [connection=pool]
   * @returns {Promise<boolean>}
   */
  async updateStatus(reference, status, connection = pool) {
    const query = `
      UPDATE bookings
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE booking_reference = ?
    `;

    const [result] = await connection.query(query, [
      status,
      reference
    ]);

    return result.affectedRows > 0;
  }
}

module.exports = new BookingRepository();