const bookingService = require('../services/bookingService');

class BookingController {
  async createBooking(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.validatedBookingData);
      res.status(201).json({
        success: true,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }

  async getBooking(req, res, next) {
    try {
      const { reference, email } = req.validatedRetrieval;
      const booking = await bookingService.getBooking(reference, email);
      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const { reference, email } = req.validatedCancellation;
      const result = await bookingService.cancelBooking(reference, email);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.booking,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();

