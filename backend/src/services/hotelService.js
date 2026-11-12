const hotelRepository = require('../repositories/hotelRepository');
const bookingRepository = require('../repositories/bookingRepository');
const { AppError } = require('../middleware/errorHandler');
const {
  calculateNights,
  calculatePeakNightlyOccupancy,
  addDays,
  isPastDate,
} = require('../utils/dateUtils');

class HotelService {
  /**
   * Retrieves all hotels, optionally filtered by location.
   * @param {{ location?: string }} filters
   * @returns {Promise<Array>}
   */
  async getAllHotels(filters = {}) {
    const hotels = await hotelRepository.findAll(filters);
    return hotels.map((h) => ({
      ...h,
      price_per_night: Number(h.price_per_night),
      amenities_list: h.amenities ? h.amenities.split(',').map((a) => a.trim()) : [],
    }));
  }

  /**
   * Retrieves a single hotel by ID.
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getHotelById(id) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) {
      throw new AppError(`Hotel with ID ${id} not found.`, 404, 'HOTEL_NOT_FOUND');
    }
    return {
      ...hotel,
      price_per_night: Number(hotel.price_per_night),
      amenities_list: hotel.amenities ? hotel.amenities.split(',').map((a) => a.trim()) : [],
    };
  }

  /**
   * Calculates room availability for a hotel across a requested date range.
   * Also computes real database-backed alternative date suggestions if sold out (Surprise Feature).
   * 
   * @param {number} hotelId 
   * @param {string} checkIn 
   * @param {string} checkOut 
   * @returns {Promise<Object>}
   */
  async getAvailability(hotelId, checkIn, checkOut) {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) {
      throw new AppError(`Hotel with ID ${hotelId} not found.`, 404, 'HOTEL_NOT_FOUND');
    }

    const roomType = await hotelRepository.findRoomTypeByHotelId(hotelId);
    if (!roomType) {
      throw new AppError(`No room configuration found for hotel ID ${hotelId}.`, 404, 'ROOM_NOT_FOUND');
    }

    const nights = calculateNights(checkIn, checkOut);
    const pricePerNight = Number(roomType.price_per_night);
    const totalCapacity = roomType.total_capacity;

    // Fetch overlapping confirmed bookings
    const overlappingBookings = await bookingRepository.getOverlappingConfirmedBookings(
      hotelId,
      roomType.id,
      checkIn,
      checkOut
    );

    const peakOccupancy = calculatePeakNightlyOccupancy(overlappingBookings, checkIn, checkOut);
    const availableRooms = Math.max(0, totalCapacity - peakOccupancy);

    // Surprise Feature: Flexible Date / Alternative Stay Suggestion
    // If 0 rooms are available for the requested dates, compute nearby alternative dates
    let suggestedAlternatives = [];
    if (availableRooms === 0) {
      suggestedAlternatives = await this.findAlternativeDates(
        hotelId,
        roomType.id,
        checkIn,
        nights,
        totalCapacity,
        pricePerNight
      );
    }

    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomTypeId: roomType.id,
      roomType: roomType.name,
      checkIn,
      checkOut,
      numberOfNights: nights,
      pricePerNight,
      totalAmount: nights * pricePerNight,
      totalCapacity,
      availableRooms,
      isAvailable: availableRooms > 0,
      suggestedAlternatives,
    };
  }

  /**
   * Computes available nearby alternative stay periods for a hotel when requested dates are sold out.
   * Evaluates date shifts (+1, -1, +2, -2, +3, -3, +7) based on actual database bookings.
   * 
   * @param {number} hotelId 
   * @param {number} roomTypeId 
   * @param {string} originalCheckIn 
   * @param {number} nights 
   * @param {number} totalCapacity 
   * @param {number} pricePerNight 
   * @returns {Promise<Array>}
   */
  async findAlternativeDates(hotelId, roomTypeId, originalCheckIn, nights, totalCapacity, pricePerNight) {
    const shiftDays = [1, -1, 2, -2, 3, -3, 4, 7];
    const alternatives = [];

    for (const offset of shiftDays) {
      if (alternatives.length >= 3) break;

      const altCheckIn = addDays(originalCheckIn, offset);
      const altCheckOut = addDays(altCheckIn, nights);

      // Do not suggest dates in the past
      if (isPastDate(altCheckIn)) continue;

      const bookings = await bookingRepository.getOverlappingConfirmedBookings(
        hotelId,
        roomTypeId,
        altCheckIn,
        altCheckOut
      );

      const peakOccupancy = calculatePeakNightlyOccupancy(bookings, altCheckIn, altCheckOut);
      const altAvailable = Math.max(0, totalCapacity - peakOccupancy);

      if (altAvailable > 0) {
        alternatives.push({
          checkIn: altCheckIn,
          checkOut: altCheckOut,
          numberOfNights: nights,
          availableRooms: altAvailable,
          pricePerNight,
          totalAmount: nights * pricePerNight,
          offsetDays: offset,
        });
      }
    }

    // Sort alternatives by absolute closeness to requested dates
    return alternatives.sort((a, b) => Math.abs(a.offsetDays) - Math.abs(b.offsetDays));
  }
}

module.exports = new HotelService();

