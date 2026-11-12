const { pool } = require('../config/database');
const hotelRepository = require('../repositories/hotelRepository');
const bookingRepository = require('../repositories/bookingRepository');
const { AppError } = require('../middleware/errorHandler');
const {
  calculateNights,
  calculatePeakNightlyOccupancy,
} = require('../utils/dateUtils');
const { generateBookingReference } = require('../utils/bookingReference');

class BookingService {
  /**
   * Create a new hotel booking.
   *
   * total_capacity = TOTAL rooms in the room type.
   * It is never decreased when a booking is created.
   *
   * Available rooms are calculated as:
   *
   *   totalCapacity - peakOccupancy
   *
   * Only CONFIRMED bookings are counted.
   * CANCELLED bookings do not consume capacity.
   */
  async createBooking({
    hotelId,
    guestName,
    guestEmail,
    checkIn,
    checkOut,
  }) {
    const connection = await pool.getConnection();

    try {
      /*
       * Start transaction.
       */
      await connection.query(
        'SET TRANSACTION ISOLATION LEVEL READ COMMITTED'
      );

      await connection.beginTransaction();

      /*
       * ------------------------------------------------------------
       * 1. Validate hotel
       * ------------------------------------------------------------
       */
      const hotel = await hotelRepository.findById(
        hotelId,
        connection
      );

      if (!hotel) {
        throw new AppError(
          `Hotel with ID ${hotelId} not found.`,
          404,
          'HOTEL_NOT_FOUND'
        );
      }

      /*
       * ------------------------------------------------------------
       * 2. Find room type for this hotel
       * ------------------------------------------------------------
       */
      const roomTypeBasic =
        await hotelRepository.findRoomTypeByHotelId(
          hotelId,
          connection
        );

      if (!roomTypeBasic) {
        throw new AppError(
          `No room configuration found for hotel ID ${hotelId}.`,
          404,
          'ROOM_NOT_FOUND'
        );
      }

      /*
       * ------------------------------------------------------------
       * 3. Lock the room type row
       *
       * FOR UPDATE prevents two concurrent transactions from
       * checking the same capacity at the same time.
       * ------------------------------------------------------------
       */
      const roomType =
        await hotelRepository.findRoomTypeByIdForUpdate(
          roomTypeBasic.id,
          connection
        );

      if (!roomType) {
        throw new AppError(
          'Room configuration could not be found.',
          404,
          'ROOM_NOT_FOUND'
        );
      }

      const totalCapacity = Number(
        roomType.total_capacity
      );

      /*
       * ------------------------------------------------------------
       * 4. Find overlapping CONFIRMED bookings
       * ------------------------------------------------------------
       */
      const overlappingBookings =
        await bookingRepository.getOverlappingConfirmedBookings(
          hotelId,
          roomType.id,
          checkIn,
          checkOut,
          connection
        );

      /*
       * ------------------------------------------------------------
       * 5. Calculate maximum simultaneous occupancy
       * ------------------------------------------------------------
       */
      const peakOccupancy =
        calculatePeakNightlyOccupancy(
          overlappingBookings,
          checkIn,
          checkOut
        );

      const availableCapacity =
        totalCapacity - peakOccupancy;

      /*
       * ------------------------------------------------------------
       * 6. Prevent overbooking
       * ------------------------------------------------------------
       */
      if (availableCapacity <= 0) {
        throw new AppError(
          'No rooms are available for the selected dates. Please choose different dates.',
          409,
          'ROOM_UNAVAILABLE'
        );
      }

      /*
       * ------------------------------------------------------------
       * 7. Calculate nights and price
       *
       * These values are calculated by the backend.
       * Never trust a total amount sent by React.
       * ------------------------------------------------------------
       */
      const nights = calculateNights(
        checkIn,
        checkOut
      );

      const pricePerNight = Number(
        roomType.price_per_night
      );

      const totalAmount =
        nights * pricePerNight;

      /*
       * ------------------------------------------------------------
       * 8. Generate unique booking reference
       * ------------------------------------------------------------
       */
      let bookingReference =
        generateBookingReference();

      let existingBooking =
        await bookingRepository.findByReference(
          bookingReference,
          connection
        );

      let attempts = 0;

      while (existingBooking && attempts < 5) {
        bookingReference =
          generateBookingReference();

        existingBooking =
          await bookingRepository.findByReference(
            bookingReference,
            connection
          );

        attempts++;
      }

      if (existingBooking) {
        throw new AppError(
          'Unable to generate a unique booking reference. Please try again.',
          500,
          'BOOKING_REFERENCE_GENERATION_FAILED'
        );
      }

      /*
       * ------------------------------------------------------------
       * 9. Create booking
       * ------------------------------------------------------------
       */
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

      const bookingId =
        await bookingRepository.createBooking(
          bookingData,
          connection
        );

      /*
       * ------------------------------------------------------------
       * 10. Recalculate availability after the booking
       *
       * This is what gives the frontend the updated room count.
       * ------------------------------------------------------------
       */
      const updatedOverlappingBookings =
        await bookingRepository.getOverlappingConfirmedBookings(
          hotelId,
          roomType.id,
          checkIn,
          checkOut,
          connection
        );

      const updatedPeakOccupancy =
        calculatePeakNightlyOccupancy(
          updatedOverlappingBookings,
          checkIn,
          checkOut
        );

      const updatedAvailableCapacity =
        totalCapacity - updatedPeakOccupancy;

      /*
       * ------------------------------------------------------------
       * 11. Commit transaction
       * ------------------------------------------------------------
       */
      await connection.commit();

      /*
       * ------------------------------------------------------------
       * 12. Return booking + updated availability
       * ------------------------------------------------------------
       */
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

        // Room availability
        totalCapacity,
        bookedCapacity: updatedPeakOccupancy,
        availableCapacity: updatedAvailableCapacity,

        message: 'Booking successfully confirmed!',
      };
    } catch (error) {
      /*
       * Roll back everything if anything fails.
       */
      await connection.rollback();

      throw error;
    } finally {
      /*
       * Always release database connection.
       */
      connection.release();
    }
  }

  /**
   * Retrieve booking using:
   *
   * booking reference + guest email
   */
  async getBooking(reference, email) {
    const booking =
      await bookingRepository.findByReference(
        reference
      );

    if (!booking) {
      throw new AppError(
        'No booking found with the provided reference.',
        404,
        'BOOKING_NOT_FOUND'
      );
    }

    /*
     * Verify email.
     */
    if (
      booking.guest_email.toLowerCase() !==
      email.toLowerCase()
    ) {
      throw new AppError(
        'The provided email address does not match this booking reference.',
        403,
        'BOOKING_EMAIL_MISMATCH'
      );
    }

    return {
      id: booking.id,

      bookingReference:
        booking.booking_reference,

      hotelId:
        booking.hotel_id,

      hotelName:
        booking.hotel_name,

      hotelLocation:
        booking.hotel_location,

      hotelImage:
        booking.hotel_image,

      roomTypeId:
        booking.room_type_id,

      roomType:
        booking.room_type_name,

      guestName:
        booking.guest_name,

      guestEmail:
        booking.guest_email,

      checkInDate:
        formatDate(booking.check_in_date),

      checkOutDate:
        formatDate(booking.check_out_date),

      numberOfNights:
        Number(booking.number_of_nights),

      pricePerNight:
        Number(booking.price_per_night),

      totalAmount:
        Number(booking.total_amount),

      status:
        booking.status,

      createdAt:
        booking.created_at,

      updatedAt:
        booking.updated_at,
    };
  }

  /**
   * Cancel booking.
   *
   * We do NOT change room_types.total_capacity.
   *
   * We only change the booking status to CANCELLED.
   * Availability queries ignore CANCELLED bookings.
   */
  async cancelBooking(reference, email) {
    const connection =
      await pool.getConnection();

    try {
      await connection.beginTransaction();

      /*
       * Get booking using transaction connection.
       */
      const booking =
        await bookingRepository.findByReference(
          reference,
          connection
        );

      if (!booking) {
        throw new AppError(
          'No booking found with the provided reference.',
          404,
          'BOOKING_NOT_FOUND'
        );
      }

      /*
       * Verify email.
       */
      if (
        booking.guest_email.toLowerCase() !==
        email.toLowerCase()
      ) {
        throw new AppError(
          'The provided email address does not match this booking reference.',
          403,
          'BOOKING_EMAIL_MISMATCH'
        );
      }

      /*
       * Prevent cancelling twice.
       */
      if (booking.status === 'CANCELLED') {
        throw new AppError(
          'This booking is already cancelled.',
          400,
          'BOOKING_ALREADY_CANCELLED'
        );
      }

      /*
       * Change CONFIRMED -> CANCELLED.
       */
      await bookingRepository.updateStatus(
        reference,
        'CANCELLED',
        connection
      );

      await connection.commit();

      /*
       * Once cancelled, this booking is no longer counted
       * by getOverlappingConfirmedBookings().
       */
      const updatedBooking =
        await this.getBooking(
          reference,
          email
        );

      return {
        success: true,

        message:
          'Booking cancelled successfully. The room is now available for other bookings.',

        booking: updatedBooking,
      };
    } catch (error) {
      await connection.rollback();

      throw error;
    } finally {
      connection.release();
    }
  }
}

/**
 * Safely convert MySQL DATE/DATETIME values
 * into YYYY-MM-DD.
 */
function formatDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.substring(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().substring(0, 10);
  }

  return String(value).substring(0, 10);
}

module.exports = new BookingService();