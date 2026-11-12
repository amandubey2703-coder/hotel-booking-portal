const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { validateHotelId, validateAvailabilityQuery } = require('../validators/hotelValidator');

// GET /api/hotels (optional query: ?location=Mumbai)
router.get('/', hotelController.getHotels);

// GET /api/hotels/:id
router.get('/:id', validateHotelId, hotelController.getHotelById);

// GET /api/hotels/:id/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
router.get('/:id/availability', validateHotelId, validateAvailabilityQuery, hotelController.getAvailability);

module.exports = router;

