const { pool } = require('../config/database');
const hotelRepository = require('../repositories/hotelRepository');
const bookingRepository = require('../repositories/bookingRepository');
const { AppError } = require('../middleware/errorHandler');
const { calculateNights, calculatePeakNightlyOccupancy } = require('../utils/dateUtils');
const { generateBookingReference } = require('../utils/bookingReference');

class BookingService {
  /**
   * Creates a new booking using an ACID MySQL transaction with InnoDB row-level locking.
   * Protects against simultaneous overbooking of the last available room.
   * 
   * @param {Object} bookingInput
   * @param {number} bookingInput.hotelId
   * @param {string} bookingInput.guestName
   * @param {string} bookingInput.guestEmail
   * @param {string} bookingInput.checkIn
   * @param {string} bookingInput.checkOut
   * @returns {Promise<Object>} Created booking record with full details
   */
  async createBooking({ hotelId, guestName, guestEmail, checkIn, checkOut }) {
    const connection = await pool.getConnection();

    try {
      // 1. Configure transaction isolation and begin atomic database transaction
      await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED;');
      await connection.beginTransaction();

      // 2. Validate hotel existence
      const hotel = await hotelRepository.findById(hotelId);
      if (!hotel) {
        throw new AppError(`Hotel with ID ${hotelId} not found.`, 404, 'HOTEL_NOT_FOUND');
      }

      // 3. Retrieve room type and acquire exclusive pessimistic row lock (FOR UPDATE)
      // Any concurrent booking attempt for this room type must wait until this transaction completes.
      const roomTypeBasic = await hotelRepository.findRoomTypeByHotelId(hotelId, connection);
      if (!roomTypeBasic) {
        throw new AppError(`No room configuration found for hotel ID ${hotelId}.`, 404, 'ROOM_NOT_FOUND');
      }

      const roomType = await hotelRepository.findRoomTypeByIdForUpdate(roomTypeBasic.id, connection);
      if (!roomType) {
        throw new AppError(`Room configuration lock could not be acquired.`, 404, 'ROOM_NOT_FOUND');
      }

      // 4. Query all overlapping confirmed bookings under active transaction
      // Overlap condition: check_in_date < checkOut AND check_out_date > checkIn
      const overlappingBookings = await bookingRepository.getOverlappingConfirmedBookings(
        hotelId,
        roomType.id,
        checkIn,
        checkOut,
        connection
      );

      // 5. Calculate occupied capacity and remaining availability
      const peakOccupancy = calculatePeakNightlyOccupancy(overlappingBookings, checkIn, checkOut);
      const availableCapacity = roomType.total_capacity - peakOccupancy;

      // 6. Overbooking prevention: If capacity <= 0, abort immediately with 409 Conflict
      if (availableCapacity <= 0) {
        throw new AppError(
          'Sorry, the requested room is no longer available for the selected dates. Please choose different dates.',
          409,
          'ROOM_UNAVAILABLE'
        );
      }

      // 7. Authoritative backend calculation of nights and total amount
      // Never trust any client-submitted total amount!
      const nights = calculateNights(checkIn, checkOut);
      const pricePerNight = Number(roomType.price_per_night);
      const totalAmount = nights * pricePerNight;

      // 8. Generate unique booking reference (e.g. HB-20261112-XXXXX)
      let bookingReference = generateBookingReference();
      // Verify collision resistance (extremely improbable, but guaranteed safe)
      let existingBooking = await bookingRepository.findByReference(bookingReference, connection);
      let attempts = 0;
      while (existingBooking && attempts < 5) {
        bookingReference = generateBookingReference();
        existingBooking = await bookingRepository.findByReference(bookingReference, connection);
        attempts++;
      }

      // 9. Insert booking record into database
      const bookingData = {
        bookingReference,
        hotelId,
        roomTypeId: roomType.id,
        guestName,
        guestEmail,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfNights: nights,
        pricePerNight,
        totalAmount,
        status: 'CONFIRMED',
      };

      const bookingId = await bookingRepository.createBooking(bookingData, connection);

      // 10. Commit the transaction
      await connection.commit();

      // Return complete booking details
      return {
        id: bookingId,
        bookingReference,
        hotelId,
        hotelName: hotel.name,
        hotelLocation: hotel.location,
        roomTypeId: roomType.id,
        roomType: roomType.name,
        guestName,
        guestEmail,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfNights: nights,
        pricePerNight,
        totalAmount,
        status: 'CONFIRMED',
        message: 'Booking successfully confirmed!',
      };
    } catch (err) {
      // Rollback on any failure to ensure database consistency
      await connection.rollback();
      throw err;
    } finally {
      // Always release connection back to pool
      connection.release();
    }
  }

  /**
   * Retrieves a booking using booking reference AND guest email.
   * Security constraint: Never retrieve using reference alone!
   * 
   * @param {string} reference 
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async getBooking(reference, email) {
    const booking = await bookingRepository.findByReference(reference);

    if (!booking) {
      throw new AppError('No booking found with the provided reference.', 404, 'BOOKING_NOT_FOUND');
    }

    // Security check: verify email matches
    if (booking.guest_email.toLowerCase() !== email.toLowerCase()) {
      throw new AppError(
        'The provided email address does not match this booking reference.',
        403,
        'BOOKING_EMAIL_MISMATCH'
      );
    }

    return {
      id: booking.id,
      bookingReference: booking.booking_reference,
      hotelId: booking.hotel_id,
      hotelName: booking.hotel_name,
      hotelLocation: booking.hotel_location,
      hotelImage: booking.hotel_image,
      roomTypeId: booking.room_type_id,
      roomType: booking.room_type_name,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      checkInDate: typeof booking.check_in_date === 'string' 
        ? booking.check_in_date.substring(0, 10) 
        : booking.check_in_date.toISOString().substring(0, 10),
      checkOutDate: typeof booking.check_out_date === 'string' 
        ? booking.check_out_date.substring(0, 10) 
        : booking.check_out_date.toISOString().substring(0, 10),
      numberOfNights: booking.number_of_nights,
      pricePerNight: Number(booking.price_per_night),
      totalAmount: Number(booking.total_amount),
      status: booking.status,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    };
  }

  /**
   * Cancels an existing booking after verifying the associated email.
   * Updates status to CANCELLED and immediately releases reserved capacity.
   * 
   * @param {string} reference 
   * @param {string} email 
   * @returns {Promise<Object>}
   */
  async cancelBooking(reference, email) {
    const booking = await bookingRepository.findByReference(reference);

    if (!booking) {
      throw new AppError('No booking found with the provided reference.', 404, 'BOOKING_NOT_FOUND');
    }

    if (booking.guest_email.toLowerCase() !== email.toLowerCase()) {
      throw new AppError(
        'The provided email address does not match this booking reference.',
        403,
        'BOOKING_EMAIL_MISMATCH'
      );
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError(
        'This booking is already cancelled.',
        400,
        'BOOKING_ALREADY_CANCELLED'
      );
    }

    await bookingRepository.updateStatus(reference, 'CANCELLED');

    const updatedBooking = await this.getBooking(reference, email);

    return {
      success: true,
      message: 'Booking cancelled successfully. Reserved room capacity has been released.',
      booking: updatedBooking,
    };
  }
}

module.exports = new BookingService();
