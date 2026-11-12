const { AppError } = require('../middleware/errorHandler');
const { isValidDateString, isPastDate, calculateNights } = require('../utils/dateUtils');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreateBooking(req, res, next) {
  const { hotelId, guestName, guestEmail, checkIn, checkOut } = req.body;

  // 1. Hotel ID
  const parsedHotelId = parseInt(hotelId, 10);
  if (!hotelId || isNaN(parsedHotelId) || parsedHotelId <= 0) {
    return next(new AppError('Valid hotelId is required.', 400, 'INVALID_HOTEL_ID'));
  }

  // 2. Guest Name
  if (!guestName || typeof guestName !== 'string' || guestName.trim().length < 2) {
    return next(
      new AppError(
        'Guest name is required and must be at least 2 characters.',
        400,
        'INVALID_GUEST_NAME'
      )
    );
  }

  if (guestName.trim().length > 100) {
    return next(
      new AppError(
        'Guest name must not exceed 100 characters.',
        400,
        'INVALID_GUEST_NAME'
      )
    );
  }

  // 3. Guest Email
  if (!guestEmail || typeof guestEmail !== 'string' || !EMAIL_REGEX.test(guestEmail.trim())) {
    return next(
      new AppError(
        'A valid email address is required.',
        400,
        'INVALID_EMAIL'
      )
    );
  }

  // 4. Check-in Date
  if (!checkIn || !isValidDateString(checkIn)) {
    return next(
      new AppError(
        'checkIn must be a valid date in YYYY-MM-DD format.',
        400,
        'INVALID_CHECK_IN_DATE'
      )
    );
  }

  if (isPastDate(checkIn)) {
    return next(
      new AppError(
        'Check-in date cannot be in the past.',
        400,
        'CHECK_IN_PAST'
      )
    );
  }

  // 5. Check-out Date
  if (!checkOut || !isValidDateString(checkOut)) {
    return next(
      new AppError(
        'checkOut must be a valid date in YYYY-MM-DD format.',
        400,
        'INVALID_CHECK_OUT_DATE'
      )
    );
  }

  const nights = calculateNights(checkIn, checkOut);
  if (nights <= 0) {
    return next(
      new AppError(
        'Check-out date must be after check-in date.',
        400,
        'INVALID_DATE_RANGE'
      )
    );
  }

  // Sanitized payload attached to request
  req.validatedBookingData = {
    hotelId: parsedHotelId,
    guestName: guestName.trim(),
    guestEmail: guestEmail.trim().toLowerCase(),
    checkIn,
    checkOut,
    nights,
  };

  next();
}

function validateRetrieveBooking(req, res, next) {
  const { reference } = req.params;
  const email = (req.query.email || '').trim().toLowerCase();

  if (!reference || reference.trim().length === 0) {
    return next(new AppError('Booking reference is required.', 400, 'MISSING_BOOKING_REFERENCE'));
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return next(new AppError('A valid email address is required to retrieve a booking.', 400, 'INVALID_EMAIL'));
  }

  req.validatedRetrieval = {
    reference: reference.trim().toUpperCase(),
    email,
  };

  next();
}

function validateCancelBooking(req, res, next) {
  const { reference } = req.params;
  const email = (req.body.email || req.query.email || '').trim().toLowerCase();

  if (!reference || reference.trim().length === 0) {
    return next(new AppError('Booking reference is required.', 400, 'MISSING_BOOKING_REFERENCE'));
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return next(new AppError('The guest email address associated with the booking is required for cancellation.', 400, 'INVALID_EMAIL'));
  }

  req.validatedCancellation = {
    reference: reference.trim().toUpperCase(),
    email,
  };

  next();
}

module.exports = {
  validateCreateBooking,
  validateRetrieveBooking,
  validateCancelBooking,
};
