const { AppError } = require('../middleware/errorHandler');
const { isValidDateString, isPastDate, calculateNights } = require('../utils/dateUtils');

function validateHotelId(req, res, next) {
  const hotelId = parseInt(req.params.id, 10);
  if (isNaN(hotelId) || hotelId <= 0) {
    return next(new AppError('Invalid hotel ID parameter.', 400, 'INVALID_HOTEL_ID'));
  }
  req.parsedHotelId = hotelId;
  next();
}

function validateAvailabilityQuery(req, res, next) {
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return next(
      new AppError(
        'Both checkIn and checkOut query parameters are required (YYYY-MM-DD).',
        400,
        'MISSING_DATE_PARAMETERS'
      )
    );
  }

  if (!isValidDateString(checkIn)) {
    return next(
      new AppError(
        'checkIn must be a valid date in YYYY-MM-DD format.',
        400,
        'INVALID_CHECK_IN_DATE'
      )
    );
  }

  if (!isValidDateString(checkOut)) {
    return next(
      new AppError(
        'checkOut must be a valid date in YYYY-MM-DD format.',
        400,
        'INVALID_CHECK_OUT_DATE'
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

  req.validatedDates = { checkIn, checkOut, nights };
  next();
}

module.exports = {
  validateHotelId,
  validateAvailabilityQuery,
};
