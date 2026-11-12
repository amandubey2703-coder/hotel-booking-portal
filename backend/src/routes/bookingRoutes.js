const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const {
  validateCreateBooking,
  validateRetrieveBooking,
  validateCancelBooking,
} = require('../validators/bookingValidator');

// POST /api/bookings - Create a new booking
router.post('/', validateCreateBooking, bookingController.createBooking);

// GET /api/bookings/:reference?email=guest@example.com - Retrieve booking
router.get('/:reference', validateRetrieveBooking, bookingController.getBooking);

// POST & PATCH /api/bookings/:reference/cancel - Cancel booking
router.post('/:reference/cancel', validateCancelBooking, bookingController.cancelBooking);
router.patch('/:reference/cancel', validateCancelBooking, bookingController.cancelBooking);

module.exports = router;
