const hotelService = require('../services/hotelService');

class HotelController {
  async getHotels(req, res, next) {
    try {
      const { location } = req.query;
      const hotels = await hotelService.getAllHotels({ location });
      res.status(200).json({
        success: true,
        count: hotels.length,
        data: hotels,
      });
    } catch (err) {
      next(err);
    }
  }

  async getHotelById(req, res, next) {
    try {
      const hotel = await hotelService.getHotelById(req.parsedHotelId);
      res.status(200).json({
        success: true,
        data: hotel,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAvailability(req, res, next) {
    try {
      const { checkIn, checkOut } = req.validatedDates;
      const availability = await hotelService.getAvailability(req.parsedHotelId, checkIn, checkOut);
      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HotelController();

